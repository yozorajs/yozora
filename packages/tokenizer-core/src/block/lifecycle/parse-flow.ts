import { BlockDataNodeType } from '../types'
import { BlockTokenizerMatchPhaseState } from './match'


/**
 * State of parse-flow phase
 */
export interface BlockTokenizerParseFlowPhaseState<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  /**
   *
   */
  type: T
  /**
   *
   */
  children?: BlockTokenizerParseFlowPhaseState[]
}


/**
 * State-tree of parse-flow phase
 */
export interface BlockTokenizerParseFlowPhaseStateTree {
  /**
   *
   */
  type: 'root'
  /**
   *
   */
  children: BlockTokenizerParseFlowPhaseState[]
}


/**
 * Hooks in the parse-flow phase
 */
export interface BlockTokenizerParseFlowPhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PFS extends BlockTokenizerParseFlowPhaseState<T> = BlockTokenizerParseFlowPhaseState<T>,
  > {
  /**
   * Parse matchStates classified to flow
   */
  parseFlow: (matchState: MS) => PFS
}
