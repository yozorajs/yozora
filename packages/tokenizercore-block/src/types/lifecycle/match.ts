import type { BlockDataNodeType } from '../base'
import type { BlockTokenizerPreMatchPhaseState } from './pre-match'


/**
 * State of match phase
 */
export interface BlockTokenizerMatchPhaseState<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  /**
   * Type of DataNode
   */
  type: T
  /**
   * Classify of DataNode
   *
   * @value flow  Represents this DataNode is in the Document-Flow
   * @value meta  Represents this DataNode is a meta data node
   */
  classify: 'flow' | 'meta'
  /**
   * List of child nodes of current data node
   */
  children?: BlockTokenizerMatchPhaseState[]
}


/**
 * Block data state-tree of match phase
 */
export interface BlockTokenizerMatchPhaseStateTree {
  /**
   * The root node identifier of the data node MatchPhaseStateTree
   */
  type: 'root'
  /**
   * Classify of the data node
   */
  classify: 'flow'
  /**
   * DatNodes which could be potential metadata of the block data state tree
   * in the match phase
   */
  meta: BlockTokenizerMatchPhaseState[]
  /**
   * List of child nodes of current data node
   */
  children: BlockTokenizerMatchPhaseState[]
}


/**
 * Hooks in the match phase
 */
export interface BlockTokenizerMatchPhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  PMS extends BlockTokenizerPreMatchPhaseState<T> = BlockTokenizerPreMatchPhaseState<T>,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  > {
  /**
   * Format/Remove the given preMatchState
   *
   * @return
   *  - {MS}: format preMatchState to the returned matchState
   *  - {null}: ignore this preMatchState
   */
  match: (
    preMatchPhaseState: PMS,
    matchedChildren: BlockTokenizerMatchPhaseState[],
  ) => MS | null
}