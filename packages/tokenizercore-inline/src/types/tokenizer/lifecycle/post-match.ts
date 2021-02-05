import type { NodePoint } from '@yozora/character'
import type { YastMeta } from '@yozora/tokenizercore'
import type { InlineTokenizerMatchPhaseState } from './match'


/**
 * Hooks in the post-match phase
 */
export interface InlineTokenizerPostMatchPhaseHook<M extends YastMeta = YastMeta> {
  /**
   * Transform matchStates
   * matchPhaseStates are peers nodes that have a common parent node
   *
   * @param states
   * @param nodePoints        An array of NodePoint
   * @param meta              Meta of the Yast
   */
  transformMatch: (
    states: ReadonlyArray<InlineTokenizerMatchPhaseState>,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => InlineTokenizerMatchPhaseState[]
}
