import type { YastBlockToken } from '../token'

/**
 * Hooks on the post-match-block phase.
 */
export interface TokenizerPostMatchBlockHook {
  /**
   * Transform YastBlockToken list.
   *
   * @param tokens      peers nodes those have a common parent.
   */
  transformMatch(tokens: ReadonlyArray<YastBlockToken>): YastBlockToken[]
}
