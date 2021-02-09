import type { NodePoint } from '@yozora/character'
import type { YastMeta, YastNode, YastNodeType } from '@yozora/tokenizercore'
import type {
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
} from './lifecycle/match'
import type { InlineTokenizerParsePhaseHook } from './lifecycle/parse'
import type { FallbackInlineTokenizer, InlineTokenizer } from './tokenizer'


export type InlineTokenizerPhase =
  | 'match'
  | 'parse'


/**
 * Set `false` to disable corresponding hook.
 */
export type InlineTokenizerHookFlags = Record<InlineTokenizerPhase, false>


export type InlineTokenizerHook =
  | InlineTokenizerMatchPhaseHook
  | InlineTokenizerParsePhaseHook


export type InlineTokenizerHookAll =
  & InlineTokenizerMatchPhaseHook
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
      YastNodeType,
      YastMeta & any,
      InlineTokenizerMatchPhaseState & any,
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
    meta: Readonly<M>,
  ) => InlineTokenizerMatchPhaseState[]

  /**
   * Called in parse phase
   *
   * @param states
   * @param nodePoints      An array of NodePoint
   * @param meta            Meta of the Yast
   */
  readonly parse: (
    states: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => YastNode[]

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
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => InlineTokenizerMatchPhaseState[]
}
