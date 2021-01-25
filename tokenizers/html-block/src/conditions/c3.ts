import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import { AsciiCodePoint } from '@yozora/character'


/**
 * Eat block html start condition 3:
 *
 *    line begins with the string `<?`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatStartCondition3(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  const i = startIndex
  if (
    i < endIndex &&
    nodePoints[i].codePoint === AsciiCodePoint.QUESTION_MARK
  ) return i + 1
  return null
}


/**
 * Eat block html end condition 3:
 *
 *    line contains the string `?>`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatEndCondition3(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  for (let i = startIndex; i < endIndex; ++i) {
    if (
      nodePoints[i].codePoint === AsciiCodePoint.QUESTION_MARK &&
      i + 1 < endIndex &&
      nodePoints[i + 1].codePoint === AsciiCodePoint.CLOSE_ANGLE
    ) return i + 2
  }
  return null
}
