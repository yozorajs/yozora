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
export function calcStartPoint(nodePoints: ReadonlyArray<INodePoint>, index: number): Point {
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
export function calcEndPoint(nodePoints: ReadonlyArray<INodePoint>, index: number): Point {
  const { line, column, offset } = nodePoints[index]
  return { line, column: column + 1, offset: offset + 1 }
}
