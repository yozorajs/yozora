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
  TokenizerMatchInlineHook,
  YastToken,
} from './types/lifecycle/match-inline'
import type { TokenizerParseInlineHook } from './types/lifecycle/parse-inline'
import type {
  FallbackInlineTokenizer,
  InlineTokenizer,
} from './types/tokenizer'
import invariant from 'tiny-invariant'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import { createPhrasingContentProcessor } from './processor'


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
    YastToken & any,
    YastNode & any>

  /**
   * Whether it is necessary to reserve the position in the YastNode produced.
   */
  readonly shouldReservePosition?: boolean
}


/**
 * Default context of InlineTokenizer
 */
export class DefaultInlineTokenizerContext<Meta extends YastMeta = YastMeta>
  implements InlineTokenizerContext<Meta> {
  protected readonly getContext = this.createImmutableContext()
  protected readonly fallbackTokenizer: FallbackInlineTokenizer | null = null
  protected readonly shouldReservePosition: boolean
  protected readonly tokenizerMap: Map<string, InlineTokenizer>
  protected readonly matchPhaseHooks:
    (InlineTokenizer & TokenizerMatchInlineHook)[]
  protected readonly parsePhaseHookMap:
    Map<YastNodeType, (InlineTokenizer & TokenizerParseInlineHook)>

  public constructor(props: DefaultInlineTokenizerContextProps = {}) {
    this.tokenizerMap = new Map()
    this.matchPhaseHooks = []
    this.parsePhaseHookMap = new Map()
    this.shouldReservePosition = props.shouldReservePosition != null
      ? Boolean(props.shouldReservePosition)
      : false

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
      YastToken & any,
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
        ? (openerDelimiter, closerDelimiter, innerTokens) => ({ token: innerTokens })
        : hook.processDelimiterPair.bind(hook)
      hook.processFullDelimiter = hook.processFullDelimiter == null
        ? () => null
        : hook.processFullDelimiter.bind(hook)

      if (tokenizerHookFlags.match !== false) {
        const index = this.matchPhaseHooks
          .findIndex(x => x.delimiterPriority < hook.delimiterPriority)
        if (index < 0) this.matchPhaseHooks.push(hook)
        else this.matchPhaseHooks.splice(index, 0, hook)
      }
    }

    // parse phase
    if (hook.processToken != null) {
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
        .forEach(entry => hookMap.delete(entry[0]))
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
    meta: Readonly<Meta>,
  ): YastToken[] {
    const processor = createPhrasingContentProcessor(this.matchPhaseHooks)
    processor.process(startIndexOfBlock, endIndexOfBlock, nodePoints, meta)

    const tokensStack: YastToken[] = processor.done()
    const resolvedResults = this.resolveFallbackTokens(
      tokensStack,
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
    matchPhaseTokens: YastToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): YastNode[] {
    const handle = (
      tokens: YastToken[],
    ): YastNode[] => {
      const results: YastNode[] = []
      for (const o of tokens) {
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
        const node = hook.processToken(o, children, nodePoints, meta)
        if (this.shouldReservePosition) {
          node.position = {
            start: calcStartYastNodePoint(nodePoints, o.startIndex),
            end: calcEndYastNodePoint(nodePoints, o.endIndex - 1),
          }
        }
        results.push(node)
      }
      return results
    }

    const results: YastNode[] = handle(matchPhaseTokens)
    return results
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public resolveFallbackTokens(
    tokens: ReadonlyArray<YastToken>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): YastToken[] {
    if (this.fallbackTokenizer == null) return tokens.slice()

    const results: YastToken[] = []

    let i = startIndex
    for (const token of tokens) {
      if (i < token.startIndex) {
        const fallbackToken = this.fallbackTokenizer
          .findAndHandleDelimiter(i, token.startIndex, nodePoints, meta)
        results.push(fallbackToken)
      }
      results.push(token)
      i = token.endIndex
    }

    if (i < endIndex) {
      const fallbackToken = this.fallbackTokenizer
        .findAndHandleDelimiter(i, endIndex, nodePoints, meta)
      results.push(fallbackToken)
    }
    return results
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => ImmutableInlineTokenizerContext<Meta>) {
    const context: ImmutableInlineTokenizerContext<Meta> = Object.freeze({
      resolveFallbackTokens: this.resolveFallbackTokens.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}
