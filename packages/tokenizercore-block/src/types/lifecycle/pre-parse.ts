import type { YastBlockNodeMeta, YastBlockNodeType } from '../base'
import type { BlockTokenizerMatchPhaseState } from './match'


/**
 * State of pre-parse phase
 */
export interface BlockTokenizerPreParsePhaseState<
  M extends YastBlockNodeMeta = YastBlockNodeMeta
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
  T extends YastBlockNodeType = YastBlockNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  M extends YastBlockNodeMeta = YastBlockNodeMeta
  > {
  /**
   * Parse matchStates classified to meta
   */
  parseMeta: (matchPhaseStates: MS[]) => M
}
