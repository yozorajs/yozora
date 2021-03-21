import type { YastNodePoint, YastNodePosition } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type { YastBlockState } from '../types/lifecycle/match-block'

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

/**
 * Calculate YastNodePosition from array of BlockTokenizerPostMatchPhaseState
 *
 * @param children
 */
export function calcPositionFromChildren(
  children?: ReadonlyArray<YastBlockState>,
): YastNodePosition | null {
  if (children == null || children.length <= 0) return null
  const firstChild = children[0]
  const lastChild = children[children.length - 1]
  const position: YastNodePosition = {
    start: { ...firstChild.position.start },
    end: { ...lastChild.position.end },
  }
  return position
}
