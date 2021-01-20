import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type { InlineTokenizerMatchPhaseState } from './match'


/**
 * Hooks in the post-match phase
 */
export interface InlineTokenizerPostMatchPhaseHook<M extends YastMeta = YastMeta>
{
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
    matchPhaseStates: Readonly<InlineTokenizerMatchPhaseState[]>,
  ) => InlineTokenizerMatchPhaseState[]
}
