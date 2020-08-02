import { RawContent } from './base'
import {
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseStateTree,
} from './lifecycle/match'
import {
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseStateTree,
} from './lifecycle/parse'
import { InlineTokenizerPostMatchPhaseHook } from './lifecycle/post-match'
import { InlineTokenizer } from './tokenizer'


export type InlineTokenizerPhase =
  | 'match'
  | 'post-match'
  | 'parse'


export type InlineTokenizerHook =
  | InlineTokenizerMatchPhaseHook
  | InlineTokenizerPostMatchPhaseHook
  | InlineTokenizerParsePhaseHook


export type InlineTokenizerHookAll =
  & InlineTokenizerMatchPhaseHook
  & InlineTokenizerPostMatchPhaseHook
  & InlineTokenizerParsePhaseHook


/**
 * 内联数据节点的词法分析器的上下文
 * Context of InlineTokenizer
 */
export interface InlineTokenizerContext {
  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleFlags  `false` represented skipped that phase
   */
  useTokenizer(
    tokenizer: InlineTokenizer & InlineTokenizerHook,
    lifecycleFlags?: Partial<Record<InlineTokenizerPhase, false>>,
  ): this

  /**
   * Called in match phase
   * @param rawContent
   * @param startIndex
   * @param endIndex
   */
  match(
    rawContent: RawContent,
    startIndex: number,
    endIndex: number,
  ): InlineTokenizerMatchPhaseStateTree

  /**
   * Called in post-match phase
   * @param rawContent
   * @param matchPhaseStateTree
   */
  postMatch(
    rawContent: RawContent,
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerMatchPhaseStateTree

  /**
   * Called in parse phase
   * @param rawContent
   * @param matchPhaseStateTree
   */
  parse(
    rawContent: RawContent,
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerParsePhaseStateTree
}
