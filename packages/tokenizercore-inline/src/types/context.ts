import type { YastMeta } from '@yozora/tokenizercore'
import type { RawContent } from './node'
import type {
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseStateTree,
} from './tokenizer/lifecycle/match'
import type {
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseStateTree,
} from './tokenizer/lifecycle/parse'
import type {
  InlineTokenizerPostMatchPhaseHook,
} from './tokenizer/lifecycle/post-match'
import type { InlineTokenizer } from './tokenizer/tokenizer'


export type InlineTokenizerPhase =
  | 'match'
  | 'post-match'
  | 'parse'


/**
 * set *false* to disable corresponding hook
 */
export type InlineTokenizerHookFlags = {
  'match.list'?: false
  'match.map'?: false
  'post-match.list'?: false
  'parse.map'?: false
}


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
    | 'match'
  >


/**
 * Context of InlineTokenizer.
 */
export interface InlineTokenizerContext<M extends YastMeta = YastMeta> {
  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleFlags  `false` represented skipped that phase
   */
  useTokenizer(
    tokenizer: InlineTokenizer & Partial<InlineTokenizerHook>,
    lifecycleFlags?: Partial<InlineTokenizerHookFlags>,
  ): this

  /**
   * Called in match phase
   * @param rawContent
   * @param startIndex
   * @param endIndex
   */
  match(
    rawContent: RawContent<M>,
    startIndex: number,
    endIndex: number,
  ): InlineTokenizerMatchPhaseStateTree

  /**
   * Called in post-match phase
   * @param rawContent
   * @param matchPhaseStateTree
   */
  postMatch(
    rawContent: RawContent<M>,
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerMatchPhaseStateTree

  /**
   * Called in parse phase
   * @param rawContent
   * @param matchPhaseStateTree
   */
  parse(
    rawContent: RawContent<M>,
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerParsePhaseStateTree
}
