import type { NodePoint } from '@yozora/character'
import type { ResultOfOptionalEater } from '../types/util'
import {
  isLineEnding,
  isSpaceCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'


/**
 * Move startIndex forward to the first non blank line position.
 *
 * A line containing no characters, or a line containing only spaces (U+0020)
 * or tabs (U+0009), is called a blank line.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @return the offset of the first non-whitespace character located.
 * @see https://github.github.com/gfm/#blank-line
 */
export function eatOptionalBlankLines(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): ResultOfOptionalEater {
  let result = startIndex
  for (let i = startIndex; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (isSpaceCharacter(c)) continue
    if (isLineEnding(c)) {
      result = i + 1
      continue
    }
    break
  }
  return result
}


/**
 * Move startIndex forward to the first non-ascii whitespace position.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @return the offset of the first non-whitespace character located.
 * @see https://github.github.com/gfm/#whitespace-character
 */
export function eatOptionalWhitespaces(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
): ResultOfOptionalEater {
  for (let i = startIndex; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (!isWhitespaceCharacter(c)) return i
  }
  return endIndex
}
