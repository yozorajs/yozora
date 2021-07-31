import type {
  PhrasingContentLine,
  PhrasingContentToken,
} from '../phrasing-content'
import type { YastBlockToken } from '../token'

/**
 * Api n post-match-block phase.
 */
export interface PostMatchBlockPhaseApi {
  /**
   * Extract phrasing content lines from block token.
   * @param token
   */
  extractPhrasingLines(
    token: YastBlockToken,
  ): ReadonlyArray<PhrasingContentLine> | null
  /**
   * Build PhrasingContentToken from phrasing content lines.
   * @param lines
   */
  buildPhrasingContentToken(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentToken | null
  /**
   * Re-match token from phrasing content lines.
   * @param lines
   * @param originalToken
   */
  rollbackPhrasingLines(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalToken: Readonly<YastBlockToken>,
  ): YastBlockToken[]
}

/**
 * Hooks on the post-match-block phase.
 */
export interface TokenizerPostMatchBlockHook {
  /**
   * Transform YastBlockToken list.
   *
   * @param tokens  peers nodes those have a same parent.
   * @param api
   */
  transformMatch(
    tokens: ReadonlyArray<YastBlockToken>,
    api: Readonly<PostMatchBlockPhaseApi>,
  ): YastBlockToken[]
}
