import type { NodePoint } from '@yozora/character'
import type { YastNodePoint } from '../types/node'


/**
 * Resolve a start YastNodePoint from EnhancedNodePoint list.
 *
 * The start field of Position represents the place of the first character of
 * the parsed source region.
 *
 * @param nodePoints
 * @param index
 *
 * @see https://github.com/syntax-tree/unist#position
 */
export function calcStartYastNodePoint(
  nodePoints: ReadonlyArray<NodePoint>,
  index: number,
): YastNodePoint {
  const { line, column, offset } = nodePoints[index]
  return { line, column, offset }
}


/**
 * Resolve a start YastNodePoint from EnhancedNodePoint list.
 *
 * The start field of Position represents the place of the first character of
 * the parsed source region.
 *
 * @param nodePoints
 * @param index
 *
 * @see https://github.com/syntax-tree/unist#position
 */
export function calcEndYastNodePoint(
  nodePoints: ReadonlyArray<NodePoint>,
  index: number,
): YastNodePoint {
  const { line, column, offset } = nodePoints[index]
  return { line, column: column + 1, offset: offset + 1 }
}
