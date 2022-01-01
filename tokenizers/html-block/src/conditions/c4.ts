import type { INodePoint } from '@yozora/character'
import { AsciiCodePoint, isAsciiUpperLetter } from '@yozora/character'

/**
 * Eat block html start condition 4:
 *
 *    line begins with the string `<!` followed by an uppercase ASCII letter.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatStartCondition4(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  const i = startIndex
  if (
    i + 1 < endIndex &&
    nodePoints[i].codePoint === AsciiCodePoint.EXCLAMATION_MARK &&
    isAsciiUpperLetter(nodePoints[i + 1].codePoint)
  )
    return i + 2
  return null
}

/**
 * Eat block html end condition 4:
 *
 *    line contains the character >.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#start-condition
 */
export function eatEndCondition4(
  nodePoints: ReadonlyArray<INodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  for (let i = startIndex; i < endIndex; ++i) {
    if (nodePoints[i].codePoint === AsciiCodePoint.CLOSE_ANGLE) return i + 1
  }
  return null
}
