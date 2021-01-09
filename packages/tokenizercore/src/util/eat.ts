import type { EnhancedYastNodePoint } from '../types/node'
import {
  AsciiCodePoint,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'


/**
 * Move forward from startIndex, and when it encounters a non-empty line,
 * go back to the first character of the non-blank line.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @return the offset of the first non-whitespace character located.
 * @see https://github.github.com/gfm/#blank-line
 */
export function eatOptionalBlankLines(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number {
  let lastNonBlankLineStartOffset = startIndex
  for (let i = startIndex; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (!isUnicodeWhiteSpaceCharacter(p.codePoint)) break
    if (p.codePoint === AsciiCodePoint.LINE_FEED) {
      lastNonBlankLineStartOffset = i + 1
    }
  }
  return lastNonBlankLineStartOffset
}


/**
 * Move startIndex one step forward from startIndex, and when the new position
 * is a non-unicode whitespace character, go back to startIndex.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @return the offset of the first non-whitespace character located.
 * @see https://github.github.com/gfm/#whitespace-character
 */
export function eatOptionalWhiteSpaces(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number {
  for (let i = startIndex; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (!isUnicodeWhiteSpaceCharacter(p.codePoint)) return i
  }
  return endIndex
}
