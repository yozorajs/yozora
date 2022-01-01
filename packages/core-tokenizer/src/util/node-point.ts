import type { IYastNodePoint, IYastNodePosition } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type { IYastBlockToken } from '../types/token'

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
  nodePoints: ReadonlyArray<INodePoint>,
  index: number,
): IYastNodePoint {
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
  nodePoints: ReadonlyArray<INodePoint>,
  index: number,
): IYastNodePoint {
  const { line, column, offset } = nodePoints[index]
  return { line, column: column + 1, offset: offset + 1 }
}

/**
 * Calculate YastNodePosition from array of BlockTokenizerPostMatchPhaseState
 *
 * @param children
 */
export function calcPositionFromChildren(
  children?: ReadonlyArray<IYastBlockToken>,
): IYastNodePosition | null {
  if (children == null || children.length <= 0) return null
  const firstChild = children[0]
  const lastChild = children[children.length - 1]
  const position: IYastNodePosition = {
    start: { ...firstChild.position.start },
    end: { ...lastChild.position.end },
  }
  return position
}
