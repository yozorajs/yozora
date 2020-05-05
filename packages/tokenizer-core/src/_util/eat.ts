import { AsciiCodePoint, isUnicodeWhiteSpaceCharacter } from '@yozora/character'
import { DataNodeTokenPointDetail } from '../_types/token'


/**
 * 消耗空行，在碰到非空行时，回退到该非空行的第一个字符处
 * Move forward from startIndex, and when it encounters a non-empty line,
 * go back to the first character of the non-blank line
 *
 * @param codePoints
 * @param startIndex
 * @param endIndex
 * @return the position of the first non-whitespace character
 * @see https://github.github.com/gfm/#blank-line
 */
export function eatOptionalBlankLines(
  codePoints: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  let lastNonBlankLineStartOffset = startIndex
  for (let i = startIndex; i < endIndex; ++i) {
    const p = codePoints[i]
    if (!isUnicodeWhiteSpaceCharacter(p.codePoint)) break
    if (p.codePoint === AsciiCodePoint.LINE_FEED) lastNonBlankLineStartOffset = i + 1
  }
  return lastNonBlankLineStartOffset
}


/**
 * 消耗 unicode 空白字符
 * Move startIndex one step forward from startIndex, and when the new position
 * is a non-unicode whitespace character, go back to startIndex
 *
 * @param codePoints
 * @param startIndex
 * @param endIndex
 * @return the position of the first non-whitespace character
 * @see https://github.github.com/gfm/#whitespace-character
 */
export function eatOptionalWhiteSpaces(
  codePoints: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  for (let i = startIndex; i < endIndex; ++i) {
    const p = codePoints[i]
    if (!isUnicodeWhiteSpaceCharacter(p.codePoint)) return i
  }
  return endIndex
}
