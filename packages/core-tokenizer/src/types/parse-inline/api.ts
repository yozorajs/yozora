import type { Node, Position } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import type { IInlineToken } from '../token'

/**
 * Api in parse-inline phase.
 */
export interface IParseInlinePhaseApi {
  /**
   * Whether it is necessary to reserve the position in the Node produced.
   */
  readonly shouldReservePosition: boolean
  /**
   * Calculate position of token.
   * @param interval
   */
  calcPosition(interval: Readonly<INodeInterval>): Position
  /**
   * Format url.
   * @param url
   */
  formatUrl(url: string): string
  /**
   * Get the node points.
   */
  getNodePoints(): ReadonlyArray<INodePoint>
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
   * @param tokens
   */
  parseInlineTokens(tokens?: ReadonlyArray<IInlineToken>): Node[]
}
