import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type { YastInlineNodeType } from '../../node'


/**
 * Hooks in the post-match phase
 */
export interface InlineTokenizerPostMatchPhaseHook<M extends YastMeta = YastMeta> {
  /**
   * Transform matchStates
   * matchPhaseStates are peers nodes that have a common parent node
   *
   * @param nodePoints        An array of EnhancedYastNodePoint
   * @param meta              Meta of the Yast
   * @param matchPhaseStates
   */
  transformMatch: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    states: ReadonlyArray<InlineTokenizerPostMatchPhaseState>,
  ) => InlineTokenizerPostMatchPhaseState[]
}


/**
 * State on post-match phase of InlineTokenizer.
 */
export interface InlineTokenizerPostMatchPhaseState<
  T extends YastInlineNodeType = YastInlineNodeType> {
  /**
   * Type of a state node.
   */
  type: T
  /**
   * List of child node of current state node.
   */
  children?: InlineTokenizerPostMatchPhaseState[]
}
