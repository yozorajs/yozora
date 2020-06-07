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
import {
  InlineTokenizerPreMatchPhaseHook,
  InlineTokenizerPreMatchPhaseStateTree,
} from './lifecycle/pre-match'
import { InlineTokenizer } from './tokenizer'


export type InlineTokenizerPhase =
  | 'pre-match'
  | 'match'
  | 'post-match'
  | 'pre-parse'
  | 'parse'


export type InlineTokenizerHook =
  | InlineTokenizerPreMatchPhaseHook
  | InlineTokenizerMatchPhaseHook
  | InlineTokenizerPostMatchPhaseHook
  | InlineTokenizerParsePhaseHook


export type InlineTokenizerHookAll =
  & InlineTokenizerPreMatchPhaseHook
  & InlineTokenizerMatchPhaseHook
  & InlineTokenizerPostMatchPhaseHook
  & InlineTokenizerParsePhaseHook


/**
 *
 */
export interface InlineTokenizerContextConstructorParams {
  /**
   *
   */
  readonly fallbackTokenizer?: InlineTokenizer & (InlineTokenizerHook | any)
}


/**
 * 内联数据节点的词法分析器的上下文
 * Context of InlineTokenizer
 */
export interface InlineTokenizerContext {
  /**
   *
   */
  useTokenizer(tokenizer: InlineTokenizer & InlineTokenizerHook): this

  /**
   * Called in pre-match phase
   */
  preMatch(
    rawContent: RawContent,
    startIndex: number,
    endIndex: number,
  ): InlineTokenizerPreMatchPhaseStateTree

  /**
   * Called in match phase
   */
  match(
    rawContent: RawContent,
    preMatchPhaseStateTree: InlineTokenizerPreMatchPhaseStateTree,
  ): InlineTokenizerMatchPhaseStateTree

  /**
   * Called in post-match phase
   * @param matchPhaseStateTree
   */
  postMatch(
    rawContent: RawContent,
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerMatchPhaseStateTree

  /**
   * Called in parse phase
   * @param matchPhaseStateTree
   */
  parse(
    rawContent: RawContent,
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerParsePhaseStateTree
}
