import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import { AsciiCodePoint } from '@yozora/character'


/**
 * Eat block html start condition 5:
 *
 *    line begins with the string `<![CDATA[`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatStartCondition5(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  const i = startIndex
  if (
    i + 6 < endIndex &&
    nodePoints[i].codePoint === AsciiCodePoint.EXCLAMATION_MARK &&
    nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET &&
    nodePoints[i + 2].codePoint === AsciiCodePoint.UPPERCASE_C &&
    nodePoints[i + 3].codePoint === AsciiCodePoint.UPPERCASE_D &&
    nodePoints[i + 4].codePoint === AsciiCodePoint.UPPERCASE_A &&
    nodePoints[i + 5].codePoint === AsciiCodePoint.UPPERCASE_T &&
    nodePoints[i + 6].codePoint === AsciiCodePoint.UPPERCASE_A
  ) return i + 7
  return null
}


/**
 * Eat block html end condition 5:
 *
 *    line contains the string `]]>`.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatEndCondition5(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  for (let i = startIndex; i < endIndex; ++i) {
    if (
      nodePoints[i].codePoint === AsciiCodePoint.CLOSE_BRACKET &&
      i + 2 < endIndex &&
      nodePoints[i + 1].codePoint === AsciiCodePoint.CLOSE_BRACKET &&
      nodePoints[i + 2].codePoint === AsciiCodePoint.CLOSE_ANGLE
    ) return i + 3
  }
  return null
}
