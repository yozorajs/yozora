import { BlockTokenizerMatchPhaseStateData } from './match'


/**
 * Hooks on the post-match phase
 */
export interface BlockTokenizerPostMatchPhaseHook {
  /**
   * Transform matchStates
   *
   * matchPhaseStates are peers nodes that have a common parent node
   */
  transformMatch: (
    matchPhaseStateDataList: Readonly<BlockTokenizerMatchPhaseStateData[]>,
  ) => BlockTokenizerMatchPhaseStateData[]
}
