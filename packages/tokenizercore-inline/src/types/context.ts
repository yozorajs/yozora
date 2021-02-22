import type { NodePoint } from '@yozora/character'
import type { YastMeta, YastNode, YastNodeType } from '@yozora/tokenizercore'
import type {
  TokenizerMatchInlineHook,
  YastToken,
  YastTokenDelimiter,
} from './lifecycle/match-inline'
import type { TokenizerParseInlineHook } from './lifecycle/parse-inline'
import type { FallbackInlineTokenizer, InlineTokenizer } from './tokenizer'


export type InlineTokenizerPhase =
  | 'match'
  | 'parse'


/**
 * Set `false` to disable corresponding hook.
 */
export type InlineTokenizerHookFlags = Record<InlineTokenizerPhase, false>


export type InlineTokenizerHook =
  | TokenizerMatchInlineHook<
    YastNodeType,
    YastMeta & any,
    YastToken,
    YastTokenDelimiter & any>
  | TokenizerParseInlineHook


export type InlineTokenizerHookAll =
  & TokenizerMatchInlineHook
  & TokenizerParseInlineHook


export type ImmutableInlineTokenizerContext<M extends YastMeta = YastMeta> =
  Pick<InlineTokenizerContext<M>, 'resolveFallbackTokens'>


/**
 * Context of InlineTokenizer.
 */
export interface InlineTokenizerContext<Meta extends YastMeta = YastMeta> {
  /**
   * Register tokenizer and hook into context.
   * @param fallbackTokenizer
   */
  readonly useFallbackTokenizer: (
    fallbackTokenizer: FallbackInlineTokenizer<
      YastNodeType,
      YastMeta & any,
      YastToken & any,
      YastNode & any>
  ) => this

  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleHookFlags  `false` represented disabled on that phase
   */
  readonly useTokenizer: (
    tokenizer: InlineTokenizer & Partial<InlineTokenizerHook>,
    lifecycleHookFlags?: Partial<InlineTokenizerHookFlags>,
  ) => this

  /**
   * Remove tokenizer which with the `tokenizerName` from the context.
   * @param tokenizer
   */
  readonly unmountTokenizer: (tokenizerName: string) => this

  /**
   * Called in match phase
   *
   * @param startIndex
   * @param endIndex
   * @param nodePoints      An array of NodePoint
   * @param meta            Meta of the Yast
   */
  readonly match: (
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ) => YastToken[]

  /**
   * Called in parse phase
   *
   * @param tokens
   * @param nodePoints      An array of NodePoint
   * @param meta            Meta of the Yast
   */
  readonly parse: (
    tokens: YastToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ) => YastNode[]

  /**
   * Resolve raw contents with fallback tokenizer.
   *
   * @param tokens
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   * @param meta
   */
  readonly resolveFallbackTokens: (
    tokens: ReadonlyArray<YastToken>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ) => YastToken[]
}
