import type { NodePoint } from '@yozora/character'
import type { YastBlockState } from './match'


/**
 * Hooks on the post-match phase.
 */
export interface BlockTokenizerPostMatchPhaseHook {
  /**
   * Transform YastBlockState list.
   *
   * @param nodePoints  array of NodePoint
   * @param states      peers nodes those have a common parent.
   */
  transformMatch: (
    states: ReadonlyArray<YastBlockState>,
    nodePoints: ReadonlyArray<NodePoint>,
  ) => YastBlockState[]
}
