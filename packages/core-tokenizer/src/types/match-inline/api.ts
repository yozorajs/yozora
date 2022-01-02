import type { INodePoint } from '@yozora/character'
import type { IYastInlineToken } from '../token'

/**
 * Api in match-inline phase.
 */
export interface IMatchInlinePhaseApi {
  /**
   * Check if there is exists a definition with the given identifier.
   * @param identifier
   */
  hasDefinition(identifier: string): boolean

  /**
   * Check if there is exists a footnote definition with the given identifier.
   * @param identifier
   */
  hasFootnoteDefinition(identifier: string): boolean

  /**
   * Get the node points.
   */
  getNodePoints(): ReadonlyArray<INodePoint>

  /**
   * Start index of current block token.
   */
  getBlockStartIndex(): number

  /**
   * End index of current block token.
   */
  getBlockEndIndex(): number

  /**
   * Resolve fallback inline tokens
   *
   * @param tokens
   * @param tokenStartIndex
   * @param tokenEndIndex
   */
  resolveFallbackTokens(
    tokens: ReadonlyArray<IYastInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
  ): ReadonlyArray<IYastInlineToken>

  /**
   * Resolve raw contents with the fallback inline tokenizer.
   *
   * @param higherPriorityTokens
   * @param startIndex
   * @param endIndex
   */
  resolveInternalTokens(
    higherPriorityTokens: ReadonlyArray<IYastInlineToken>,
    startIndex: number,
    endIndex: number,
  ): ReadonlyArray<IYastInlineToken>
}
