import type { YastBlockState } from './match-block'

/**
 * Hooks on the post-match-block phase.
 */
export interface TokenizerPostMatchBlockHook {
  /**
   * Transform YastBlockState list.
   *
   * @param states      peers nodes those have a common parent.
   */
  transformMatch(states: ReadonlyArray<YastBlockState>): YastBlockState[]
}
