import type { Node } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type { IBlockToken } from '../token'

/** A lazy request for the core parser to process block tokens. */
export interface IParseBlockTokensRequest {
  readonly type: 'blockTokens'
  readonly tokens?: readonly IBlockToken[]
}

/**
 * Api in parse-block phase.
 */
export interface IParseBlockPhaseApi {
  /**
   * Whether it is necessary to reserve the position in the Node produced.
   */
  readonly shouldReservePosition: boolean
  /**
   * Format url.
   * @param url
   */
  formatUrl(url: string): string
  /**
   * Process node points into inline nodes.
   * @param nodePoints
   * @param startIndex Inclusive start index. Defaults to zero.
   * @param endIndex Exclusive end index. Defaults to nodePoints.length.
   */
  processInlines(nodePoints: readonly INodePoint[], startIndex?: number, endIndex?: number): Node[]
  /**
   * Create a request that a generator hook can yield without recursively
   * parsing child tokens on the JavaScript call stack.
   *
   * @param tokens Block tokens to parse.
   */
  requestBlockTokens(tokens?: readonly IBlockToken[]): IParseBlockTokensRequest
}
