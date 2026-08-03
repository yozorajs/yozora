import type { Node } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'

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
}
