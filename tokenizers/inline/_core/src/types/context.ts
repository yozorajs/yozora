import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
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
export interface InlineTokenizerContextConstructorParams<
  M extends any = any,
  > {
  /**
   *
   */
  readonly fallbackTokenizer?: InlineTokenizer & (InlineTokenizerHook | any)
}


/**
 * 内联数据节点的词法分析器的上下文
 * Context of InlineTokenizer
 */
export interface InlineTokenizerContext<M extends any = any> {
  /**
   *
   */
  useTokenizer(tokenizer: InlineTokenizer & InlineTokenizerHook): void

  /**
   * Called in pre-match phase
   * @param codePositions
   * @param startIndex
   * @param endIndex
   */
  preMatch(
    codePositions: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
  ): InlineTokenizerPreMatchPhaseStateTree

  /**
   * Called in match phase
   * @param preMatchPhaseStateTree
   */
  match(
    codePositions: DataNodeTokenPointDetail[],
    preMatchPhaseStateTree: InlineTokenizerPreMatchPhaseStateTree,
  ): InlineTokenizerMatchPhaseStateTree

  /**
   * Called in post-match phase
   * @param matchPhaseStateTree
   */
  postMatch(
    codePositions: DataNodeTokenPointDetail[],
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerMatchPhaseStateTree

  /**
   * Called in parse phase
   * @param matchPhaseStateTree
   */
  parse(
    codePositions: DataNodeTokenPointDetail[],
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerParsePhaseStateTree<M>
}
