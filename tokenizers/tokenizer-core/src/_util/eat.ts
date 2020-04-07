import { CodePoint } from '../_constant/character'
import { DataNodeTokenPointDetail } from '../_types/token'
import { isUnicodeWhiteSpace } from './character'


/**
 * 消耗空行，在碰到非空行时，回退到该非空行的第一个字符处
 *
 * Move forward from the first character of a line, and when it encounters a non-empty line,
 * go back to the first character of the non-blank line
 *
 * @param content
 * @param codePoints
 * @param startIndex
 * @param endIndex
 * @return the position of the first non-whitespace character
 * @see https://github.github.com/gfm/#blank-line
 */
export function eatOptionalBlankLines(
  content: string,
  codePoints: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  let lastNonBlankLineStartOffset = startIndex
  for (let i = startIndex; i < endIndex; ++i) {
    const p = codePoints[i]
    if (!isUnicodeWhiteSpace(p.codePoint)) break
    if (p.codePoint === CodePoint.LINE_FEED) lastNonBlankLineStartOffset = i + 1
  }
  return lastNonBlankLineStartOffset
}


/**
 * 消耗 unicode 空白字符
 *
 * @param content
 * @param codePoints
 * @param startIndex
 * @param endIndex
 * @return the position of the first non-whitespace character
 * @see https://github.github.com/gfm/#whitespace-character
 */
export function eatOptionalWhiteSpaces(
  content: string,
  codePoints: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  for (let i = startIndex; i < endIndex; ++i) {
    const p = codePoints[i]
    if (!isUnicodeWhiteSpace(p.codePoint)) return i
  }
  return endIndex
}
