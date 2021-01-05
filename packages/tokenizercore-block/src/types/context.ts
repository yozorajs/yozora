import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseHook,
  ClosedBlockTokenizerMatchPhaseStateTree,
} from './lifecycle/match'
import type {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseStateTree,
} from './lifecycle/parse'
import type { BlockTokenizerPostMatchPhaseHook } from './lifecycle/post-match'
import type { BlockTokenizerPostParsePhaseHook } from './lifecycle/post-parse'
import type { YastBlockNodeMeta } from './node'
import type { BlockTokenizer } from './tokenizer'


export type BlockTokenizerPhase =
  | 'match'
  | 'post-match'
  | 'parse'
  | 'post-parse'


/**
 *
 */
export type BlockTokenizerLifecycleFlags = Partial<Record<BlockTokenizerPhase, false>>


export type BlockTokenizerHook =
  | BlockTokenizerMatchPhaseHook
  | BlockTokenizerPostMatchPhaseHook
  | BlockTokenizerParsePhaseHook
  | BlockTokenizerPostParsePhaseHook


export type BlockTokenizerHookAll =
  & BlockTokenizerMatchPhaseHook
  & BlockTokenizerPostMatchPhaseHook
  & BlockTokenizerParsePhaseHook
  & BlockTokenizerPostParsePhaseHook


/**
 * Context of BlockTokenizer.
 */
export interface BlockTokenizerContext<
  M extends YastBlockNodeMeta = YastBlockNodeMeta
  > {
  /**
   * Register tokenizer and hook into context
   * @param tokenizer
   * @param lifecycleFlags  `false` represented skipped that phase
   */
  useTokenizer(
    tokenizer: BlockTokenizer & Partial<BlockTokenizerHook>,
    lifecycleFlags?: Readonly<BlockTokenizerLifecycleFlags>,
  ): this

  /**
   * Called on match phase
   * @param nodePoints
   * @param startIndex
   * @param endIndex
   */
  match(
    nodePoints: YastNodePoint[],
    startIndex: number,
    endIndex: number,
  ): ClosedBlockTokenizerMatchPhaseStateTree

  /**
   * Called on post-match phase
   * @param closedMatchPhaseStateTree
   */
  postMatch(
    closedMatchPhaseStateTree: ClosedBlockTokenizerMatchPhaseStateTree,
  ): ClosedBlockTokenizerMatchPhaseStateTree

  /**
   * Called on parse phase
   * @param closedMatchPhaseStateTree
   */
  parse(
    closedMatchPhaseStateTree: ClosedBlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerParsePhaseStateTree<M>

  /**
   * Called on post-parse-phase
   * @param parsePhaseStateTree
   */
  postParse(
    parsePhaseStateTree: BlockTokenizerParsePhaseStateTree<M>
  ): BlockTokenizerParsePhaseStateTree<M>
}
