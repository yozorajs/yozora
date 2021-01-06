import type { ClosedBlockTokenizerMatchPhaseState } from './match'


/**
 * Hooks on the post-match phase
 */
export interface BlockTokenizerPostMatchPhaseHook {
  /**
   * Transform matchStates
   * closedMatchPhaseStates are peers nodes that have a common parent node
   */
  transformMatch: (
    closedMatchPhaseStates: Readonly<ClosedBlockTokenizerMatchPhaseState[]>,
  ) => ClosedBlockTokenizerMatchPhaseState[]
}
