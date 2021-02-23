import type { NodePoint } from '@yozora/character'
import type { YastNodePosition } from '../types/node'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentState,
} from '../types/phrasing-content'
import { isWhitespaceCharacter } from '@yozora/character'
import { PhrasingContentType } from '../types/phrasing-content'
import { calcEndYastNodePoint, calcStartYastNodePoint } from './node-point'
import { trimBlankLines } from './whitespace'


/**
 * Calculate YastNodePosition from an array of PhrasingContentLine.
 * @param lines Not empty array of PhrasingContentLine
 */
export function calcPositionFromPhrasingContentLines(
  lines: ReadonlyArray<PhrasingContentLine>,
): YastNodePosition {
  const firstLine: PhrasingContentLine = lines[0]
  const lastLine: PhrasingContentLine = lines[lines.length - 1]
  const position: YastNodePosition = {
    start: calcStartYastNodePoint(firstLine.nodePoints, firstLine.startIndex),
    end: calcEndYastNodePoint(lastLine.nodePoints, lastLine.endIndex - 1),
  }
  return position
}


/**
 * Build PhrasingContentState from a list of PhrasingContentLine.
 * @param _lines
 */
export function buildPhrasingContentState(
  _lines: ReadonlyArray<PhrasingContentLine>,
): PhrasingContentState | null {
  const lines = trimBlankLines(_lines)
  if (lines == null) return null

  const position = calcPositionFromPhrasingContentLines(lines)
  const state: PhrasingContentState = {
    type: PhrasingContentType,
    lines,
    position,
  }
  return state
}


/**
 * Build PhrasingContent from PhrasingContentState.
 * @param state
 */
export function buildPhrasingContent(
  state: Readonly<PhrasingContentState>,
): PhrasingContent | null {
  const contents = mergeContentLinesAndStrippedLines(state.lines)
  if (contents.length <= 0) return null

  const node: PhrasingContent = { type: PhrasingContentType, contents }
  return node
}


/**
 * Merge list of PhrasingContentLine to a NodePoint list
 * and keep the spaces faithfully.
 *
 * @param nodePoints
 * @param lines
 * @param startLineIndex
 * @param endLineIndex
 */
export function mergeContentLinesFaithfully(
  lines: PhrasingContentLine[],
  startLineIndex = 0,
  endLineIndex = lines.length
): NodePoint[] {
  const contents: NodePoint[] = []
  if (
    startLineIndex >= endLineIndex ||
    startLineIndex < 0 ||
    endLineIndex > lines.length
  ) return []

  for (let i = startLineIndex; i < endLineIndex; ++i) {
    const { nodePoints, startIndex, endIndex } = lines[i]
    for (let i = startIndex; i < endIndex; ++i) {
      contents.push(nodePoints[i])
    }
  }
  return contents
}


/**
 * Merge list of PhrasingContentLine to a NodePoint list and
 * stripped leading spaces of every line and the trailing spaces of the last line.
 *
 * @param nodePoints
 * @param lines
 * @param startLineIndex
 * @param endLineIndex
 */
export function mergeContentLinesAndStrippedLines(
  lines: PhrasingContentLine[],
  startLineIndex = 0,
  endLineIndex = lines.length
): NodePoint[] {
  const contents: NodePoint[] = []
  if (
    startLineIndex >= endLineIndex ||
    startLineIndex < 0 ||
    endLineIndex > lines.length
  ) return []

  for (let i = startLineIndex; i + 1 < endLineIndex; ++i) {
    const { nodePoints, endIndex, firstNonWhitespaceIndex } = lines[i]

    /**
     * Leading spaces are skipped
     * @see https://github.github.com/gfm/#example-192
     */
    for (let i = firstNonWhitespaceIndex; i < endIndex; ++i) {
      contents.push(nodePoints[i])
    }
  }

  /**
   * Final spaces are stripped before inline parsing, so a phrasingContent that
   * ends with two or more spaces will not end with a hard line break
   * @see https://github.github.com/gfm/#example-196
   */
  const { nodePoints, endIndex, firstNonWhitespaceIndex } = lines[endLineIndex - 1]
  let lastNonWhitespaceIndex = endIndex - 1
  for (; lastNonWhitespaceIndex >= 0; --lastNonWhitespaceIndex) {
    const p = nodePoints[lastNonWhitespaceIndex]
    if (!isWhitespaceCharacter(p.codePoint)) break
  }
  for (let i = firstNonWhitespaceIndex; i <= lastNonWhitespaceIndex; ++i) {
    contents.push(nodePoints[i])
  }

  return contents
}
