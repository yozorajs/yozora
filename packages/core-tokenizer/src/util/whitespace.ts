import type { ICodePoint, INodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isLineEnding,
  isSpaceCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'
import type { IPhrasingContentLine } from '../types/phrasing-content'
import type { IResultOfOptionalEater } from '../types/util'

const TAB_SIZE = 4

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
 * Consume indentation of `indentWidth`, measured in visual columns, and return
 * the index of the first unconsumed node point. A space occupies one column,
 * while a tab advances to the next tab stop.
 *
 * Virtual spaces from a tab share a source offset. Some of them only pad the
 * fixed-size representation. If the requested indentation ends inside a tab,
 * the returned index preserves its unconsumed columns as virtual spaces.
 *
 * Returns null when the range contains fewer than `indentWidth` visual columns.
 *
 * @see https://github.github.com/gfm/#tabs
 */
export function eatIndentation(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
  indentWidth: number,
): number | null {
  if (indentWidth <= 0) return startIndex

  const directEndIndex = startIndex + indentWidth
  if (directEndIndex > endIndex) return null

  let containsTab = false
  for (let i = startIndex; i < directEndIndex; ++i) {
    // Virtual spaces originate from tabs and require tab-stop-aware calculation.
    if (nodePoints[i].codePoint === VirtualCodePoint.SPACE) {
      containsTab = true
      break
    }
  }
  if (!containsTab) return directEndIndex

  const line: number = nodePoints[startIndex].line
  let lineStartIndex: number = startIndex
  while (lineStartIndex > 0 && nodePoints[lineStartIndex - 1].line === line) lineStartIndex -= 1

  let column: number = 0
  let remainingWidth: number = indentWidth
  for (let i = lineStartIndex; i < endIndex;) {
    if (i >= startIndex && remainingWidth <= 0) return i

    const nodePoint: INodePoint = nodePoints[i]
    if (nodePoint.codePoint !== VirtualCodePoint.SPACE) {
      if (i >= startIndex) remainingWidth -= 1
      column += 1
      i += 1
      continue
    }

    let tabEndIndex = i + 1
    while (
      tabEndIndex < endIndex &&
      nodePoints[tabEndIndex].codePoint === VirtualCodePoint.SPACE &&
      nodePoints[tabEndIndex].offset === nodePoint.offset
    ) {
      tabEndIndex += 1
    }

    const tabWidth = TAB_SIZE - (column % TAB_SIZE)
    const padding = tabEndIndex - i - tabWidth
    for (let j = i; j < tabEndIndex; ++j) {
      const width = j - i < padding ? 0 : 1
      if (j >= startIndex && width > 0) {
        if (remainingWidth <= 0) return j
        remainingWidth -= 1
      }
      column += width
    }
    i = tabEndIndex
  }
  return remainingWidth <= 0 ? endIndex : null
}

/**
 * Calculate the visual width of indentation in the given range.
 *
 * @see https://github.github.com/gfm/#tabs
 */
export function calcIndentWidth(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): number {
  if (startIndex >= endIndex) return 0

  let containsTab = false
  for (let i = startIndex; i < endIndex; ++i) {
    const nodePoint: INodePoint = nodePoints[i]
    if (nodePoint.codePoint === VirtualCodePoint.SPACE) containsTab = true
    else if (!isSpaceCharacter(nodePoint.codePoint)) return i - startIndex
  }
  if (!containsTab) return endIndex - startIndex

  const line: number = nodePoints[startIndex].line
  let lineStartIndex: number = startIndex
  while (lineStartIndex > 0 && nodePoints[lineStartIndex - 1].line === line) lineStartIndex -= 1

  let column: number = 0
  let indentWidth: number = 0
  for (let i = lineStartIndex; i < endIndex;) {
    const nodePoint: INodePoint = nodePoints[i]
    if (nodePoint.codePoint !== VirtualCodePoint.SPACE) {
      if (i >= startIndex) {
        if (!isSpaceCharacter(nodePoint.codePoint)) break
        indentWidth += 1
      }
      column += 1
      i += 1
      continue
    }

    let tabEndIndex = i + 1
    while (
      tabEndIndex < nodePoints.length &&
      nodePoints[tabEndIndex].line === line &&
      nodePoints[tabEndIndex].codePoint === VirtualCodePoint.SPACE &&
      nodePoints[tabEndIndex].offset === nodePoint.offset
    ) {
      tabEndIndex += 1
    }

    const tabWidth = TAB_SIZE - (column % TAB_SIZE)
    const padding = tabEndIndex - i - tabWidth
    for (let j = i; j < tabEndIndex && j < endIndex; ++j) {
      const width = j - i < padding ? 0 : 1
      if (j >= startIndex) indentWidth += width
      column += width
    }
    i = tabEndIndex
  }
  return indentWidth
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
 * Check whether the given range contains only spaces, tabs, or line endings.
 *
 * @see https://github.github.com/gfm/#blank-line
 */
export function isBlankRange(
  nodePoints: readonly INodePoint[],
  startIndex: number,
  endIndex: number,
): boolean {
  for (let i = startIndex; i < endIndex; ++i) {
    const codePoint = nodePoints[i].codePoint
    if (
      codePoint !== AsciiCodePoint.SPACE &&
      codePoint !== VirtualCodePoint.SPACE &&
      codePoint !== VirtualCodePoint.LINE_END
    ) {
      return false
    }
  }
  return true
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
