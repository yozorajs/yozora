import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type { YastInlineNode, YastInlineNodeType } from './node'
import type {
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
} from './tokenizer/lifecycle/match'
import type {
  InlineTokenizerParsePhaseHook,
} from './tokenizer/lifecycle/parse'
import type {
  InlineTokenizerPostMatchPhaseHook,
} from './tokenizer/lifecycle/post-match'
import type {
  FallbackInlineTokenizer,
  InlineTokenizer,
} from './tokenizer/tokenizer'


export type InlineTokenizerPhase =
  | 'match'
  | 'post-match'
  | 'parse'


/**
 * Set `false` to disable corresponding hook.
 */
export type InlineTokenizerHookFlags = Record<InlineTokenizerPhase, false>


export type InlineTokenizerHook =
  | InlineTokenizerMatchPhaseHook
  | InlineTokenizerPostMatchPhaseHook
  | InlineTokenizerParsePhaseHook


export type InlineTokenizerHookAll =
  & InlineTokenizerMatchPhaseHook
  & InlineTokenizerPostMatchPhaseHook
  & InlineTokenizerParsePhaseHook


export type ImmutableInlineTokenizerContext<M extends YastMeta = YastMeta> =
  Pick<
    InlineTokenizerContext<M>,
    | 'resolveFallbackStates'
  >


/**
 * Context of InlineTokenizer.
 */
export interface InlineTokenizerContext<M extends YastMeta = YastMeta> {
  /**
   * Register tokenizer and hook into context.
   * @param fallbackTokenizer
   */
  readonly useFallbackTokenizer: (
    fallbackTokenizer: FallbackInlineTokenizer<
      YastInlineNodeType,
      YastMeta & any,
      InlineTokenizerMatchPhaseState & any,
      YastInlineNode & any>
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
   * @param nodePoints      An array of EnhancedYastNodePoint
   * @param meta            Meta of the Yast
   */
  readonly match: (
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => InlineTokenizerMatchPhaseState[]

  /**
   * Called in post-match phase
   *
   * @param states
   * @param nodePoints      An array of EnhancedYastNodePoint
   * @param meta            Meta of the Yast
   */
  readonly postMatch: (
    states: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => InlineTokenizerMatchPhaseState[]

  /**
   * Called in parse phase
   *
   * @param states
   * @param nodePoints      An array of EnhancedYastNodePoint
   * @param meta            Meta of the Yast
   */
  readonly parse: (
    states: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => YastInlineNode[]

  /**
   * Resolve raw contents with fallback tokenizer.
   *
   * @param states
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   * @param meta
   */
  readonly resolveFallbackStates: (
    states: ReadonlyArray<InlineTokenizerMatchPhaseState>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => InlineTokenizerMatchPhaseState[]
}
