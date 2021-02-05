import type { NodePoint } from '@yozora/character'
import { AsciiCodePoint } from '@yozora/character'


/**
 * Eat block html start condition 2:
 *
 *    Line begins with the string `<!--`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatStartCondition2(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  const i = startIndex
  if (
    i + 2 < endIndex &&
    nodePoints[i].codePoint === AsciiCodePoint.EXCLAMATION_MARK &&
    nodePoints[i + 1].codePoint === AsciiCodePoint.MINUS_SIGN &&
    nodePoints[i + 2].codePoint === AsciiCodePoint.MINUS_SIGN
  ) return i + 3
  return null
}


/**
 * Eat block html end condition 2:
 *
 *    line contains the string `-->`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatEndCondition2(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  for (let i = startIndex; i < endIndex; ++i) {
    if (
      nodePoints[i].codePoint === AsciiCodePoint.MINUS_SIGN &&
      i + 2 < endIndex &&
      nodePoints[i + 1].codePoint === AsciiCodePoint.MINUS_SIGN &&
      nodePoints[i + 2].codePoint === AsciiCodePoint.CLOSE_ANGLE
    ) return i + 3
  }
  return null
}
