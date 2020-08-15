import { BlockDataNodeMetaData, BlockDataNodeType } from '../base'
import { BlockTokenizerMatchPhaseState } from './match'
import { BlockTokenizerPreParsePhaseState } from './pre-parse'


/**
 * State of parse phase
 */
export interface BlockTokenizerParsePhaseState<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  /**
   * Type of DataNode
   */
  type: T
  /**
   * List of child nodes of current data node
   */
  children?: BlockTokenizerParsePhaseState[]
}


/**
 * State-tree of parse phase
 */
export interface BlockTokenizerParsePhaseStateTree<
  M extends BlockDataNodeMetaData = BlockDataNodeMetaData
  > {
  /**
   * The root node identifier of the ParsePhaseStateTree
   */
  type: 'root'
  /**
   * Metadata of the block data state tree in the parse phase
   */
  meta: M
  /**
   * List of child nodes of current data node
   */
  children: BlockTokenizerParsePhaseState[]
}


/**
 * Hooks in the parse phase
 */
export interface BlockTokenizerParsePhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PFS extends BlockTokenizerParsePhaseState<T> = BlockTokenizerParsePhaseState<T>,
  M extends BlockDataNodeMetaData = BlockDataNodeMetaData,
  PMS extends BlockTokenizerPreParsePhaseState<M> = BlockTokenizerPreParsePhaseState<M>,
  > {
  /**
   * Parse matchStates classified to flow
   */
  parseFlow: (
    matchPhaseState: MS,
    preParsePhaseState: PMS,
    parsedChildren?: BlockTokenizerParsePhaseState[],
  ) => PFS
}
