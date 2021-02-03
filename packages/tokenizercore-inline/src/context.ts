import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type {
  ImmutableInlineTokenizerContext,
  InlineTokenizerContext,
  InlineTokenizerHook,
  InlineTokenizerHookAll,
  InlineTokenizerHookFlags,
} from './types/context'
import type { YastInlineNode, YastInlineNodeType } from './types/node'
import type {
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
} from './types/tokenizer/lifecycle/match'
import type {
  InlineTokenizerParsePhaseHook,
} from './types/tokenizer/lifecycle/parse'
import type {
  InlineTokenizerPostMatchPhaseHook,
} from './types/tokenizer/lifecycle/post-match'
import type {
  FallbackInlineTokenizer,
  InlineTokenizer,
} from './types/tokenizer/tokenizer'
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
    YastInlineNodeType,
    YastMeta & any,
    InlineTokenizerMatchPhaseState & any,
    YastInlineNode & any>
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
  protected readonly postMatchPhaseHooks:
    (InlineTokenizer & InlineTokenizerPostMatchPhaseHook)[]
  protected readonly parsePhaseHookMap:
    Map<YastInlineNodeType, (InlineTokenizer & InlineTokenizerParsePhaseHook)>

  public constructor(props: DefaultInlineTokenizerContextProps) {
    this.tokenizerMap = new Map()
    this.matchPhaseHooks = []
    this.postMatchPhaseHooks = []
    this.parsePhaseHookMap = new Map()

    if (props.fallbackTokenizer != null) {
      this.fallbackTokenizer = props.fallbackTokenizer
      this.useTokenizer(this.fallbackTokenizer, {
        'match': false,
        'post-match': false,
      })
    }
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
      recognizedTypes: YastInlineNodeType[],
      hookMap: Map<YastInlineNodeType, InlineTokenizer>,
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

    // post-match phase
    if (hook.transformMatch != null) {
      registerIntoHookList(this.postMatchPhaseHooks, 'post-match')
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
  public match(
    startIndexOfBlock: number,
    endIndexOfBlock: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
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
  public postMatch(
    matchPhaseStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): InlineTokenizerMatchPhaseState[] {
    if (this.postMatchPhaseHooks.length <= 0) return matchPhaseStates

    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (
      states: InlineTokenizerMatchPhaseState[],
    ): InlineTokenizerMatchPhaseState[] => {
      for (const o of states) {
        if (o.children == null || o.children.length <= 0) continue
        const children = handle(o.children)
        o.children = children
      }

      let results: InlineTokenizerMatchPhaseState[] = states
      for (const hook of this.postMatchPhaseHooks) {
        results = hook.transformMatch(results, nodePoints, meta)
      }
      return results
    }

    const results: InlineTokenizerMatchPhaseState[] = handle(matchPhaseStates)
    return results
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public parse(
    matchPhaseStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): YastInlineNode[] {
    const handle = (
      states: InlineTokenizerMatchPhaseState[],
    ): YastInlineNode[] => {
      const results: YastInlineNode[] = []
      for (const o of states) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.parsePhaseHookMap.get(o.type)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[DBTContext#parse] no tokenizer for '${ o.type }' found`
        )

        const children: YastInlineNode[] | undefined = o.children != null
          ? handle(o.children)
          : undefined
        const nodes = hook.parse(o, children, nodePoints, meta)
        results.push(nodes)
      }
      return results
    }

    const results: YastInlineNode[] = handle(matchPhaseStates)
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
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
      match: this.match.bind(this),
      postMatch: this.postMatch.bind(this),
      parse: this.parse.bind(this),
      resolveFallbackStates: this.resolveFallbackStates.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}
