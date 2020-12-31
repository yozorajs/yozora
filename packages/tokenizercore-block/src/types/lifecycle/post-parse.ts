import type { BlockDataNodeMetaData } from '../base'
import type { BlockTokenizerParsePhaseState } from './parse'


/**
 * Hooks in the post-parse phase
 */
export interface BlockTokenizerPostParsePhaseHook<
  M extends BlockDataNodeMetaData = BlockDataNodeMetaData
  > {
  /**
   * Transform parseStates
   * parsePhaseStates are peers nodes that have a common parent node
   */
  transformParse: (
    meta: M,
    parsePhaseStates: Readonly<BlockTokenizerParsePhaseState[]>,
  ) => BlockTokenizerParsePhaseState[]
}