import type { NodePoint } from '@yozora/character'
import type { YastMeta } from '@yozora/tokenizercore'
import type { YastBlockNode } from '../../node'


/**
 * Hooks on the post-parse phase
 */
export interface BlockTokenizerPostParsePhaseHook<M extends YastMeta = YastMeta> {
  /**
   * Transform parseStates
   * parsePhaseStates are peers nodes that have a common parent node
   */
  transformParse: (
    nodePoints: ReadonlyArray<NodePoint>,
    states: ReadonlyArray<YastBlockNode>,
    meta: M,
  ) => YastBlockNode[]
}
