import type { NodePoint } from '@yozora/character'
import type { YastNodePosition, YastNodeType } from '@yozora/tokenizercore'


/**
 * Hooks on the post-match phase.
 */
export interface BlockTokenizerPostMatchPhaseHook {
  /**
   * Transform matchStates.
   *
   * @param nodePoints  array of NodePoint
   * @param states      peers nodes those have a common parent.
   */
  transformMatch: (
    states: ReadonlyArray<BlockTokenizerPostMatchPhaseState>,
    nodePoints: ReadonlyArray<NodePoint>,
  ) => BlockTokenizerPostMatchPhaseState[]
}


/**
 * State on post-match phase of BlockTokenizer.
 */
export interface BlockTokenizerPostMatchPhaseState<
  T extends YastNodeType = YastNodeType> {
  /**
   * Type of a state node.
   */
  type: T
  /**
   * Location of a node in the source contents.
   */
  position: YastNodePosition
  /**
   * List of child node of current state node.
   */
  children?: BlockTokenizerPostMatchPhaseState[]
}
