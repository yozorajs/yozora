import type { BlockDataNodeMetaData, BlockDataNodeType } from '../base'
import type { BlockTokenizerMatchPhaseState } from './match'


/**
 * State of pre-parse phase
 */
export interface BlockTokenizerPreParsePhaseState<
  M extends BlockDataNodeMetaData = BlockDataNodeMetaData
  > {
  /**
   * Metadata of the block data state tree on pre-parse phase
   */
  meta: M
}


/**
 * Hooks in the pre-meta phase
 */
export interface BlockTokenizerPreParsePhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  M extends BlockDataNodeMetaData = BlockDataNodeMetaData
  > {
  /**
   * Parse matchStates classified to meta
   */
  parseMeta: (matchPhaseStates: MS[]) => M
}
