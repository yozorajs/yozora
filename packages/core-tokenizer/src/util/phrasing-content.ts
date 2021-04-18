import type { YastNodePosition } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  isLineEnding,
  isSpaceCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'
import type { PhrasingContentLine } from '../types/phrasing-content'
import { calcEndYastNodePoint, calcStartYastNodePoint } from './node-point'

/**
 * Create a generator to produce PhrasingContentLines while consuming NodePoints.
 *
 * @param nodePointsList
 * @returns
 */
export function* createPhrasingLineGenerator(
  nodePointsList: Iterable<NodePoint[]>,
): Iterable<PhrasingContentLine[]> &
  Iterator<PhrasingContentLine[], NodePoint[]> {
  const allNodePoints: NodePoint[] = []
  let startIndex = 0
  let firstNonWhitespaceIndex = 0
  let countOfPrecedeSpaces = 0

  for (const nodePoints of nodePointsList) {
    const lines: PhrasingContentLine[] = []
    for (const p of nodePoints) {
      const c = p.codePoint

      // Check if it is still a space in the beginning of a line.
      if (firstNonWhitespaceIndex === allNodePoints.length) {
        if (isSpaceCharacter(c)) {
          countOfPrecedeSpaces += 1
          firstNonWhitespaceIndex += 1
        }
      }

      allNodePoints.push(p)
      if (isLineEnding(c)) {
        // Check if it is a blank line.
        if (firstNonWhitespaceIndex + 1 === allNodePoints.length) {
          firstNonWhitespaceIndex += 1
        }

        const line: PhrasingContentLine = {
          nodePoints: allNodePoints,
          startIndex,
          endIndex: allNodePoints.length,
          firstNonWhitespaceIndex,
          countOfPrecedeSpaces,
        }
        lines.push(line)
        startIndex = allNodePoints.length
        firstNonWhitespaceIndex = allNodePoints.length
        countOfPrecedeSpaces = 0
      }
    }
    yield lines
  }

  // After the iterable dried, there is still has some nodePoints.
  if (startIndex < allNodePoints.length) {
    const line: PhrasingContentLine = {
      nodePoints: allNodePoints,
      startIndex,
      endIndex: allNodePoints.length,
      firstNonWhitespaceIndex,
      countOfPrecedeSpaces,
    }
    yield [line]
  }
  return allNodePoints
}

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
 * Merge list of PhrasingContentLine to a NodePoint list
 * and keep the spaces faithfully.
 *
 * @param nodePoints
 * @param lines
 * @param startLineIndex
 * @param endLineIndex
 */
export function mergeContentLinesFaithfully(
  lines: ReadonlyArray<PhrasingContentLine>,
  startLineIndex = 0,
  endLineIndex = lines.length,
): NodePoint[] {
  if (
    startLineIndex >= endLineIndex ||
    startLineIndex < 0 ||
    endLineIndex > lines.length
  )
    return []

  const contents: NodePoint[] = []
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
  lines: ReadonlyArray<PhrasingContentLine>,
  startLineIndex = 0,
  endLineIndex = lines.length,
): NodePoint[] {
  const contents: NodePoint[] = []
  if (
    startLineIndex >= endLineIndex ||
    startLineIndex < 0 ||
    endLineIndex > lines.length
  )
    return []

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
  const { nodePoints, endIndex, firstNonWhitespaceIndex } = lines[
    endLineIndex - 1
  ]
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
