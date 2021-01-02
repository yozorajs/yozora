import type { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import type { BlockDataNodeMetaData } from './base'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseStateTree,
} from './lifecycle/match'
import type {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseStateTree,
} from './lifecycle/parse'
import type { BlockTokenizerPostMatchPhaseHook } from './lifecycle/post-match'
import type { BlockTokenizerPostParsePhaseHook } from './lifecycle/post-parse'
import type {
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseStateTree,
} from './lifecycle/pre-match'
import type {
  BlockTokenizerPreParsePhaseHook,
  BlockTokenizerPreParsePhaseState,
} from './lifecycle/pre-parse'
import type { BlockTokenizer } from './tokenizer'


export type BlockTokenizerPhase =
  | 'pre-match'
  | 'match'
  | 'post-match'
  | 'pre-parse'
  | 'parse'
  | 'post-parse'


export type BlockTokenizerHook =
  | BlockTokenizerPreMatchPhaseHook
  | BlockTokenizerMatchPhaseHook
  | BlockTokenizerPostMatchPhaseHook
  | BlockTokenizerPreParsePhaseHook
  | BlockTokenizerParsePhaseHook
  | BlockTokenizerPostParsePhaseHook


export type BlockTokenizerHookAll =
  & BlockTokenizerPreMatchPhaseHook
  & BlockTokenizerMatchPhaseHook
  & BlockTokenizerPostMatchPhaseHook
  & BlockTokenizerPreParsePhaseHook
  & BlockTokenizerParsePhaseHook
  & BlockTokenizerPostParsePhaseHook


/**
 * 块状数据节点的词法分析器的上下文
 * Context of BlockTokenizer
 */
export interface BlockTokenizerContext<
  M extends BlockDataNodeMetaData = BlockDataNodeMetaData
  > {
  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleFlags  `false` represented skipped that phase
   */
  useTokenizer(
    tokenizer: BlockTokenizer & Partial<BlockTokenizerHook>,
    lifecycleFlags?: Partial<Record<BlockTokenizerPhase, false>>,
  ): this

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

  /**
   * Called in post-parse-phase
   * @param parsePhaseStateTree
   */
  postParse(
    parsePhaseStateTree: BlockTokenizerParsePhaseStateTree<M>
  ): BlockTokenizerParsePhaseStateTree<M>
}
