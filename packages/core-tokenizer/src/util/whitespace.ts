import type { ICodePoint, INodePoint } from '@yozora/character'
import { isLineEnding, isSpaceCharacter, isWhitespaceCharacter } from '@yozora/character'
import type { IPhrasingContentLine } from '../types/phrasing-content'
import type { IResultOfOptionalEater } from '../types/util'

/**
 * Move startIndex forward to the position of the first non-${codePoint} character.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @param codePoint
 * @returns
 */
export function eatOptionalCharacters(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
  codePoint: ICodePoint,
): IResultOfOptionalEater {
  let i = startIndex
  while (i < endIndex && nodePoints[i].codePoint === codePoint) i += 1
  return i
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
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): IResultOfOptionalEater {
  let i: number = startIndex
  while (i < endIndex && isWhitespaceCharacter(nodePoints[i].codePoint)) i += 1
  return i
}

/**
 * Move endIndex forward to the first non-ascii whitespace position.
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @return the offset of the first non-whitespace character located.
 * @see https://github.github.com/gfm/#whitespace-character
 */
export function eatOptionalWhitespacesReverse(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): IResultOfOptionalEater {
  let i: number = endIndex - 1
  while (i >= startIndex && isWhitespaceCharacter(nodePoints[i].codePoint)) i -= 1
  return i + 1
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
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): IResultOfOptionalEater {
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
export function trimBlankLines(lines: readonly IPhrasingContentLine[]): IPhrasingContentLine[] {
  if (lines.length <= 0) return []

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

  if (startLineIndex > endLineIndex) return []
  return lines.slice(startLineIndex, endLineIndex + 1)
}
