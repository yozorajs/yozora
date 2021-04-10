import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentToken,
} from './phrasing-content'
import type { YastBlockToken } from './token'

/**
 * Context of Tokenizer.
 */
export interface TokenizerContext {
  /**
   * Build PhrasingContentPostMatchPhaseState from array of PhrasingContentLine
   * @param lines
   */
  buildPhrasingContentToken(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentToken | null

  /**
   * Build PhrasingContentMatchPhaseState from array of PhrasingContentLine
   *
   * @param nodePoints
   * @param lines
   */
  buildPhrasingContent(
    token: Readonly<PhrasingContentToken>,
  ): PhrasingContent | null

  /**
   * Build YastBlockToken.
   *
   * @param lines
   * @param originalToken
   */
  buildBlockToken(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalToken: Readonly<YastBlockToken>,
  ): YastBlockToken | null

  /**
   * Extract array of PhrasingContentLine from a given YastBlockToken.
   * @param token
   */
  extractPhrasingContentLines(
    originalToken: Readonly<YastBlockToken>,
  ): ReadonlyArray<PhrasingContentLine> | null
}
