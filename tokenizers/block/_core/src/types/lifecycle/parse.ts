import { BlockDataNodeType } from '../base'
import { BlockTokenizerMatchPhaseState } from './match'
import { BlockTokenizerPreParsePhaseState } from './pre-parse'


/**
 * State of parse phase
 */
export interface BlockTokenizerParsePhaseState<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  /**
   *
   */
  type: T
  /**
   *
   */
  children?: BlockTokenizerParsePhaseState[]
}


/**
 * State-tree of parse phase
 */
export interface BlockTokenizerParsePhaseStateTree<M = any> {
  /**
   *
   */
  type: 'root'
  /**
   *
   */
  meta: Record<BlockDataNodeType, M>
  /**
   *
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
  M extends any = any,
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
