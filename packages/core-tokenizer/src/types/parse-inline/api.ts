import type { IYastNode, IYastNodePosition } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import type { IYastInlineToken } from '../token'

/**
 * Api in parse-inline phase.
 */
export interface IParseInlinePhaseApi {
  /**
   * Get the node points.
   */
  getNodePoints(): ReadonlyArray<INodePoint>
  /**
   * Calculate position of token.
   * @param interval
   */
  calcPosition(interval: Readonly<INodeInterval>): IYastNodePosition
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
   * Parse inline tokens to Yozora AST nodes.
   * @param token
   */
  parseInlineTokens(tokens: ReadonlyArray<IYastInlineToken>): IYastNode[]
}
