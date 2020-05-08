import { DataNodeTokenPointDetail } from '@yozora/tokenizer-core'
import { InlineDataNodeParseFunc } from './base'
import {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseStateTree,
} from './lifecycle/match'
import {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseStateTree,
} from './lifecycle/parse'
import { BlockTokenizerPostMatchPhaseHook } from './lifecycle/post-match'
import {
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseStateTree,
} from './lifecycle/pre-match'
import {
  BlockTokenizerPreParsePhaseHook,
  BlockTokenizerPreParsePhaseState,
} from './lifecycle/pre-parse'
import { BlockTokenizer } from './tokenizer'


export type BlockTokenizerPhase =
  | 'pre-match'
  | 'match'
  | 'post-match'
  | 'pre-parse'
  | 'parse'


export type BlockTokenizerHook =
  | BlockTokenizerPreMatchPhaseHook
  | BlockTokenizerMatchPhaseHook
  | BlockTokenizerPostMatchPhaseHook
  | BlockTokenizerPreParsePhaseHook
  | BlockTokenizerParsePhaseHook


export type BlockTokenizerHookAll =
  & BlockTokenizerPreMatchPhaseHook
  & BlockTokenizerMatchPhaseHook
  & BlockTokenizerPostMatchPhaseHook
  & BlockTokenizerPreParsePhaseHook
  & BlockTokenizerParsePhaseHook


/**
 *
 */
export interface BlockTokenizerContextConstructorParams<
  M extends any = any,
  > {
  /**
   *
   */
  readonly fallbackTokenizer?: BlockTokenizer & (BlockTokenizerHook | any),
  /**
   *
   */
  readonly parseInlineData?: InlineDataNodeParseFunc<M>,
}


/**
 * 块状数据节点的词法分析器的上下文
 * Context of BlockTokenizer
 */
export interface BlockTokenizerContext<M extends any = any> {
  /**
   *
   */
  useTokenizer(tokenizer: BlockTokenizer & BlockTokenizerHook): void

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
  ): BlockTokenizerPreMatchPhaseStateTree

  /**
   * Called in match phase
   * @param preMatchPhaseStateTree
   */
  match(
    preMatchPhaseStateTree: BlockTokenizerPreMatchPhaseStateTree,
  ): BlockTokenizerMatchPhaseStateTree

  /**
   * Called in post-match phase
   * @param matchPhaseStateTree
   */
  postMatch(
    matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerMatchPhaseStateTree

  /**
   * Called in pre-parse phase
   * @param matchPhaseStateTree
   */
  preParse(
    matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerPreParsePhaseState<M>

  /**
   * Called in parse phase
   * @param matchPhaseStateTree
   */
  parse(
    matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree,
    preParsePhaseState: BlockTokenizerPreParsePhaseState<M>,
  ): BlockTokenizerParsePhaseStateTree<M>
}
