import { BlockDataNodeType } from '../types'
import { BlockTokenizerMatchPhaseState } from './match'


/**
 * State of parse-meta phase
 */
export interface BlockTokenizerParseMetaPhaseStateTree<M = any> {
  /**
   *
   */
  type: 'root'
  /**
   *
   */
  meta: Record<BlockDataNodeType, M>
}


/**
 * Hooks in the parse-meta phase
 */
export interface BlockTokenizerParseMetaPhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  M extends any = any,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PMST extends BlockTokenizerParseMetaPhaseStateTree<M> = BlockTokenizerParseMetaPhaseStateTree<M>,
  > {
  /**
   * Parse matchStates classified to meta
   */
  parseMeta: (matchStates: MS[]) => PMST
}
