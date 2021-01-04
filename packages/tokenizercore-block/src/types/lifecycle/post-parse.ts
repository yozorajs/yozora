import type { YastBlockNodeMeta } from '../node'
import type { BlockTokenizerParsePhaseState } from './parse'


/**
 * Hooks on the post-parse phase
 */
export interface BlockTokenizerPostParsePhaseHook<
  M extends YastBlockNodeMeta = YastBlockNodeMeta
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
