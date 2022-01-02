import type { IPhrasingContentLine, IPhrasingContentToken } from '../phrasing-content'
import type { IYastBlockToken } from '../token'

/**
 * Api in match-block phase.
 */
export interface IMatchBlockPhaseApi {
  /**
   * Extract phrasing content lines from block token.
   * @param token
   */
  extractPhrasingLines(token: IYastBlockToken): ReadonlyArray<IPhrasingContentLine> | null
  /**
   * Build PhrasingContentToken from phrasing content lines.
   * @param lines
   */
  buildPhrasingContentToken(
    lines: ReadonlyArray<IPhrasingContentLine>,
  ): IPhrasingContentToken | null
  /**
   * Re-match token from phrasing content lines.
   * @param lines
   * @param originalToken
   */
  rollbackPhrasingLines(
    lines: ReadonlyArray<IPhrasingContentLine>,
    originalToken?: Readonly<IYastBlockToken>,
  ): IYastBlockToken[]
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
