import { BlockDataNodeType } from '../base'
import { BlockTokenizerPreMatchPhaseState } from './pre-match'


/**
 * State of match phase
 */
export interface BlockTokenizerMatchPhaseState<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  /**
   *
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
   *
   */
  children?: BlockTokenizerMatchPhaseState[]
}


/**
 * State-tree of match phase
 */
export interface BlockTokenizerMatchPhaseStateTree {
  /**
   *
   */
  type: 'root'
  /**
   *
   */
  meta: BlockTokenizerMatchPhaseState[]
  /**
   *
   */
  children: BlockTokenizerMatchPhaseState[]
  /**
   *
   */
  classify: 'flow'
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
   *
   * Format/Remove the given preMatchState
   *
   * @return
   *  - {MS}: format preMatchState to the returned matchState
   *  - {false}: ignore this preMatchState
   */
  match: (preMatchPhaseState: PMS) => MS | false
}
