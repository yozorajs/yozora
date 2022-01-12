import type { Node, NodePosition } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import type { IYastInlineToken } from '../token'

/**
 * Api in parse-inline phase.
 */
export interface IParseInlinePhaseApi {
  /**
   * Whether it is necessary to reserve the position in the Node produced.
   */
  readonly shouldReservePosition: boolean
  /**
   * Get the node points.
   */
  getNodePoints(): ReadonlyArray<INodePoint>
  /**
   * Calculate position of token.
   * @param interval
   */
  calcPosition(interval: Readonly<INodeInterval>): NodePosition
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
  parseInlineTokens(tokens?: ReadonlyArray<IYastInlineToken>): Node[]
}
