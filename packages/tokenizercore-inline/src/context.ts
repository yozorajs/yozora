import type { NodePoint } from '@yozora/character'
import type { YastMeta, YastNode, YastNodeType } from '@yozora/tokenizercore'
import type {
  ImmutableInlineTokenizerContext,
  InlineTokenizerContext,
  InlineTokenizerHook,
  InlineTokenizerHookAll,
  InlineTokenizerHookFlags,
} from './types/context'
import type {
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
} from './types/lifecycle/match'
import type { InlineTokenizerParsePhaseHook } from './types/lifecycle/parse'
import type {
  FallbackInlineTokenizer,
  InlineTokenizer,
} from './types/tokenizer'
import invariant from 'tiny-invariant'
import { createInlineContentProcessor } from './processor/inline-content'


/**
 * Params for constructing DefaultInlineTokenizerContext
 */
export interface DefaultInlineTokenizerContextProps {
  /**
   * Fallback tokenizer.
   */
  readonly fallbackTokenizer?: FallbackInlineTokenizer<
    YastNodeType,
    YastMeta & any,
    InlineTokenizerMatchPhaseState & any,
    YastNode & any>
}


/**
 * Default context of InlineTokenizer
 */
export class DefaultInlineTokenizerContext<M extends Readonly<YastMeta> = Readonly<YastMeta>>
  implements InlineTokenizerContext<M> {
  protected readonly getContext = this.createImmutableContext()
  protected readonly fallbackTokenizer: FallbackInlineTokenizer | null = null
  protected readonly tokenizerMap: Map<string, InlineTokenizer>
  protected readonly matchPhaseHooks:
    (InlineTokenizer & InlineTokenizerMatchPhaseHook)[]
  protected readonly parsePhaseHookMap:
    Map<YastNodeType, (InlineTokenizer & InlineTokenizerParsePhaseHook)>

  public constructor(props: DefaultInlineTokenizerContextProps = {}) {
    this.tokenizerMap = new Map()
    this.matchPhaseHooks = []
    this.parsePhaseHookMap = new Map()

    const fallbackTokenizer = props.fallbackTokenizer != null
      ? props.fallbackTokenizer
      : null
    if (fallbackTokenizer != null) {
      this.useFallbackTokenizer(fallbackTokenizer)
    }
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public useFallbackTokenizer(
    fallbackTokenizer: FallbackInlineTokenizer<
      YastNodeType,
      YastMeta & any,
      InlineTokenizerMatchPhaseState & any,
      YastNode & any>
  ): this {
    // Unmount old fallback tokenizer
    if (this.fallbackTokenizer != null) {
      const tokenizerName = this.fallbackTokenizer.name
        ; (this as any).fallbackTokenizer = null
      this.unmountTokenizer(tokenizerName)
    }

    // register fallback tokenizer
    this.useTokenizer(fallbackTokenizer, { 'match': false })

    const self = this as unknown as {
      fallbackTokenizer: FallbackInlineTokenizer
    }
    self.fallbackTokenizer = fallbackTokenizer
    return this
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public useTokenizer(
    tokenizer: InlineTokenizer & Partial<InlineTokenizerHook>,
    tokenizerHookFlags: Partial<InlineTokenizerHookFlags> = {},
  ): this {
    if (this.tokenizerMap.has(tokenizer.name)) {
      throw new TypeError(`[InlineTokenizerContext] Duplicated tokenizer name: (${ tokenizer.name })`)
    }
    this.tokenizerMap.set(tokenizer.name, tokenizer)

    // eslint-disable-next-line no-param-reassign
    tokenizer.getContext = this.getContext as () => ImmutableInlineTokenizerContext
    const hook = tokenizer as InlineTokenizer & InlineTokenizerHookAll

    // register into this.*Hooks
    const registerIntoHookList = (
      hooks: InlineTokenizer[],
      flag: keyof InlineTokenizerHookFlags,
    ): void => {
      if (tokenizerHookFlags[flag] === false) return
      hooks.push(hook)
    }

    // register into this.*HookMap
    const registerIntoHookMap = (
      recognizedTypes: YastNodeType[],
      hookMap: Map<YastNodeType, InlineTokenizer>,
      flag: keyof InlineTokenizerHookFlags,
    ): void => {
      if (tokenizerHookFlags[flag] === false) return
      for (const t of recognizedTypes) {
        // There is already a tokenizer for this type of data.
        if (hookMap.has(t)) continue

        hookMap.set(t, hook)
      }
    }

    // match phase
    if (hook.findDelimiter != null) {
      hook.isDelimiterPair = hook.isDelimiterPair == null
        ? () => ({ paired: true })
        : hook.isDelimiterPair
      hook.processDelimiterPair = hook.processDelimiterPair == null
        ? (openerDelimiter, closerDelimiter, innerStates) => ({ state: innerStates })
        : hook.processDelimiterPair.bind(hook)
      hook.processFullDelimiter = hook.processFullDelimiter == null
        ? () => null
        : hook.processFullDelimiter.bind(hook)
      registerIntoHookList(this.matchPhaseHooks, 'match')
      this.matchPhaseHooks.sort((x, y) => y.delimiterPriority - x.delimiterPriority)
    }

    // parse phase
    if (hook.parse != null) {
      registerIntoHookMap(hook.recognizedTypes, this.parsePhaseHookMap, 'parse')
    }

    return this
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public unmountTokenizer(tokenizerName: string): this {
    invariant(
      this.fallbackTokenizer == null || this.fallbackTokenizer.name !== tokenizerName,
      'Cannot unmount fallbackTokenizer, please use `useFallbackTokenizer()` instead.'
    )

    // Unmount from this.*Hooks
    const unmountFromHookList = (hooks: InlineTokenizer[]): void => {
      const hookIndex = this.matchPhaseHooks
        .findIndex(hook => hook.name === tokenizerName)
      if (hookIndex >= 0) hooks.splice(hookIndex, 1)
    }

    // Unmount from this.*HookMap
    const unmountFromHookMap = (
      hookMap: Map<YastNodeType, InlineTokenizer>
    ): void => {
      [...hookMap.entries()]
        .filter(entry => entry[1].name === tokenizerName)
        .forEach(entry => hookMap.delete[entry[0]])
    }

    unmountFromHookMap(this.tokenizerMap)
    unmountFromHookList(this.matchPhaseHooks)
    unmountFromHookMap(this.parsePhaseHookMap)
    return this
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public match(
    startIndexOfBlock: number,
    endIndexOfBlock: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ): InlineTokenizerMatchPhaseState[] {
    const processor = createInlineContentProcessor(this.matchPhaseHooks)
    processor.process(meta, nodePoints, startIndexOfBlock, endIndexOfBlock)

    const statesStack: InlineTokenizerMatchPhaseState[] = processor.done()
    const resolvedResults = this.resolveFallbackStates(
      statesStack,
      startIndexOfBlock,
      endIndexOfBlock,
      nodePoints,
      meta,
    )
    return resolvedResults
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public parse(
    matchPhaseStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ): YastNode[] {
    const handle = (
      states: InlineTokenizerMatchPhaseState[],
    ): YastNode[] => {
      const results: YastNode[] = []
      for (const o of states) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.parsePhaseHookMap.get(o.type)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[DBTContext#parse] no tokenizer for '${ o.type }' found`
        )

        const children: YastNode[] | undefined = o.children != null
          ? handle(o.children)
          : undefined
        const nodes = hook.parse(o, children, nodePoints, meta)
        results.push(nodes)
      }
      return results
    }

    const results: YastNode[] = handle(matchPhaseStates)
    return results
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public resolveFallbackStates(
    states: ReadonlyArray<InlineTokenizerMatchPhaseState>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ): InlineTokenizerMatchPhaseState[] {
    if (this.fallbackTokenizer == null) return states.slice()

    const results: InlineTokenizerMatchPhaseState[] = []

    let i = startIndex
    for (const state of states) {
      if (i < state.startIndex) {
        const fallbackState = this.fallbackTokenizer
          .findAndHandleDelimiter(i, state.startIndex, nodePoints, meta)
        results.push(fallbackState)
      }
      results.push(state)
      i = state.endIndex
    }

    if (i < endIndex) {
      const fallbackState = this.fallbackTokenizer
        .findAndHandleDelimiter(i, endIndex, nodePoints, meta)
      results.push(fallbackState)
    }
    return results
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => ImmutableInlineTokenizerContext<M>) {
    const context: ImmutableInlineTokenizerContext<M> = Object.freeze({
      resolveFallbackStates: this.resolveFallbackStates.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}
