import type { BlockTokenizerMatchPhaseState } from './match'


/**
 * Hooks in the post-match phase
 */
export interface BlockTokenizerPostMatchPhaseHook {
  /**
   * Transform matchStates
   * matchPhaseStates are peers nodes that have a common parent node
   */
  transformMatch: (
    matchPhaseStates: Readonly<BlockTokenizerMatchPhaseState[]>,
  ) => BlockTokenizerMatchPhaseState[]
}
