import type { Node } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type { IBlockToken } from '../token'

/**
 * Api in parse-block phase.
 */
export interface IParseBlockPhaseApi {
  /**
   * Whether it is necessary to reserve the position in the Node produced.
   */
  readonly shouldReservePosition: boolean
  /**
   * Process node points into inline nodes.
   * @param nodePoints
   */
  processInlines(nodePoints: ReadonlyArray<INodePoint>): Node[]
  /**
   * Parse block tokens to Yozora AST nodes.
   * @param tokens
   */
  parseBlockTokens(tokens?: ReadonlyArray<IBlockToken>): Node[]
}
