import type { NodePoint } from '@yozora/character'
import type { PhrasingContentLine } from '../types/phrasing-content'
import type { ResultOfOptionalEater } from '../types/util'
import {
  isLineEnding,
  isSpaceCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'

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
 * Stripped preceding and tailing blank lines.
 */
export function trimBlankLines(
  lines: ReadonlyArray<PhrasingContentLine>,
): PhrasingContentLine[] | null {
  if (lines.length <= 0) return null

  // Find the first non-blank line index.
  let startLineIndex = 0
  for (; startLineIndex < lines.length; ++startLineIndex) {
    const line = lines[startLineIndex]
    if (line.firstNonWhitespaceIndex < line.endIndex) break
  }

  // Find the last non-blank line index.
  let endLineIndex = lines.length - 1
  for (; endLineIndex > startLineIndex; --endLineIndex) {
    const line = lines[endLineIndex]
    if (line.firstNonWhitespaceIndex < line.endIndex) break
  }

  if (startLineIndex > endLineIndex) return null
  return lines.slice(startLineIndex, endLineIndex + 1)
}
