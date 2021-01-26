import type { EnhancedYastNodePoint } from '../types/node'
import {
  AsciiCodePoint,
  isAsciiDigitCharacter,
  isAsciiLetter,
} from '@yozora/character'


/**
 * A tag name consists of an ASCII letter followed by zero or more ASCII
 * letters, digits, or hyphens (-).
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#tag-name
 */
export function eatHTMLTagName(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number | null {
  if (
    startIndex >= endIndex ||
    !isAsciiLetter(nodePoints[startIndex].codePoint)
  ) return null

  let i = startIndex
  for (; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (
      isAsciiLetter(c) ||
      isAsciiDigitCharacter(c) ||
      c === AsciiCodePoint.MINUS_SIGN
    ) continue
    return i
  }
  return i
}
