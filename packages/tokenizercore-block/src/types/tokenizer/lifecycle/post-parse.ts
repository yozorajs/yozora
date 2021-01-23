import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type { BlockTokenizerParsePhaseState } from './parse'


/**
 * Hooks on the post-parse phase
 */
export interface BlockTokenizerPostParsePhaseHook<
  M extends YastMeta = YastMeta
  > {
  /**
   * Transform parseStates
   * parsePhaseStates are peers nodes that have a common parent node
   */
  transformParse: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    states: ReadonlyArray<BlockTokenizerParsePhaseState>,
    meta: M,
  ) => BlockTokenizerParsePhaseState[]
}
