import type { Point } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'

/**
 * Resolve a start Point from INodePoint list.
 *
 * The start field of Position represents the place of the first character of
 * the parsed source region.
 *
 * @param nodePoints
 * @param index
 *
 * @see https://github.com/syntax-tree/unist#position
 */
export function calcStartPoint(nodePoints: readonly INodePoint[], index: number): Point {
  const { line, column, offset } = nodePoints[index]
  return { line, column, offset }
}

/**
 * Resolve a start Point from INodePoint list.
 *
 * The start field of Position represents the place of the first character of
 * the parsed source region.
 *
 * @param nodePoints
 * @param index
 *
 * @see https://github.com/syntax-tree/unist#position
 */
export function calcEndPoint(nodePoints: readonly INodePoint[], index: number): Point {
  const { line, column, offset, codePoint } = nodePoints[index]
  // Keep end positions aligned with the UTF-16 source-unit strategy used by
  // the node-point generator.
  const width = codePoint > 0xffff ? 2 : 1
  return { line, column: column + width, offset: offset + width }
}
