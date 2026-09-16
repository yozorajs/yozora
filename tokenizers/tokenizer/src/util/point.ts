import type { Point } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import { VirtualCodePoint } from '@yozora/character'

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
 * Resolve an end Point from INodePoint list.
 *
 * The end field of Position represents the first source point after the parsed
 * source region.
 *
 * @param nodePoints
 * @param index
 *
 * @see https://github.com/syntax-tree/unist#position
 */
export function calcEndPoint(nodePoints: readonly INodePoint[], index: number): Point {
  const { line, column, offset, codePoint, sourceWidth } = nodePoints[index]
  // A normalized line ending advances to the next line, while CRLF occupies
  // two source code units even though tokenizers see one virtual point.
  if (codePoint === VirtualCodePoint.LINE_END) {
    return { line: line + 1, column: 1, offset: offset + (sourceWidth ?? 1) }
  }

  // Keep end positions aligned with the UTF-16 source-unit strategy used by
  // the node-point generator.
  const width = sourceWidth ?? (codePoint > 0xffff ? 2 : 1)
  return { line, column: column + width, offset: offset + width }
}
