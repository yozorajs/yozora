import type { IPhrasingContentLine } from '../phrasing-content'
import type { IBlockToken } from '../token'

/**
 * Api in match-block phase.
 */
export interface IMatchBlockPhaseApi {
  /**
   * Extract phrasing content lines from block token.
   * @param token
   */
  extractPhrasingLines(token: IBlockToken): readonly IPhrasingContentLine[] | null
  /**
   * Re-match token from phrasing content lines.
   * @param lines
   * @param originalToken
   */
  rollbackPhrasingLines(
    lines: readonly IPhrasingContentLine[],
    originalToken?: Readonly<IBlockToken>,
  ): IBlockToken[]
  /**
   * Register a definition identifier.
   * @param identifier
   */
  registerDefinitionIdentifier(identifier: string): void
  /**
   * Register a footnote definition identifier.
   * @param identifier
   */
  registerFootnoteDefinitionIdentifier(identifier: string): void
}
