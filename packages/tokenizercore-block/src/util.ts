import type {
  EnhancedYastNodePoint,
  YastNodePosition,
} from '@yozora/tokenizercore'
import type {
  BlockTokenizerPostMatchPhaseState,
  PhrasingContentLine,
} from './types/tokenizer'
import { isWhiteSpaceCharacter } from '@yozora/character'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'


/**
 * Calculate YastNodePosition from array of PhrasingContentLine
 *
 * @param nodePoints
 * @param lines
 */
export function calcPositionFromPhrasingContentLines(
  lines: ReadonlyArray<PhrasingContentLine>,
): YastNodePosition | null {
  if (lines.length <= 0) return null

  const firstLine: PhrasingContentLine = lines[0]
  const lastLine: PhrasingContentLine = lines[lines.length - 1]
  const position: YastNodePosition = {
    start: calcStartYastNodePoint(firstLine.nodePoints, firstLine.startIndex),
    end: calcEndYastNodePoint(lastLine.nodePoints, lastLine.endIndex - 1),
  }
  return position
}


/**
 * Calculate YastNodePosition from array of BlockTokenizerPostMatchPhaseState
 *
 * @param children
 */
export function calcPositionFromChildren(
  children?: ReadonlyArray<BlockTokenizerPostMatchPhaseState>
): YastNodePosition | null {
  if (children == null || children.length <= 0) return null
  const firstChild = children[0]
  const lastChild = children[children.length - 1]
  const position: YastNodePosition = {
    start: { ...firstChild.position.start },
    end: { ...lastChild.position.end },
  }
  return position
}


/**
 * Merge list of PhrasingContentLine to a EnhancedYastNodePoint list
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
): EnhancedYastNodePoint[] {
  const contents: EnhancedYastNodePoint[] = []
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
 * Merge list of PhrasingContentLine to a EnhancedYastNodePoint list and
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
): EnhancedYastNodePoint[] {
  const contents: EnhancedYastNodePoint[] = []
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
  let lastNonWhiteSpaceIndex = endIndex - 1
  for (; lastNonWhiteSpaceIndex >= 0; --lastNonWhiteSpaceIndex) {
    const p = nodePoints[lastNonWhiteSpaceIndex]
    if (!isWhiteSpaceCharacter(p.codePoint)) break
  }
  for (let i = firstNonWhitespaceIndex; i <= lastNonWhiteSpaceIndex; ++i) {
    contents.push(nodePoints[i])
  }

  return contents
}
