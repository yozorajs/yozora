import { BlockDataNodeType } from '../base'
import { BlockTokenizerMatchPhaseState } from './match'


/**
 * State of pre-parse phase
 */
export interface BlockTokenizerPreParsePhaseState<M = any> {
  /**
   *
   */
  meta: Record<BlockDataNodeType, M>
}


/**
 * Hooks in the pre-meta phase
 */
export interface BlockTokenizerPreParsePhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  M extends any = any,
  > {
  /**
   * Parse matchStates classified to meta
   */
  parseMeta: (matchPhaseStates: MS[]) => M
}
