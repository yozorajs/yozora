import type { NodePoint } from '@yozora/character'
import type { YastNodePosition } from '@yozora/tokenizercore'
import type { PhrasingContentLine } from './phrasing-content/types'
import type { YastBlockState } from './types/lifecycle/match-block'
import { isWhitespaceCharacter } from '@yozora/character'


/**
 * Calculate YastNodePosition from array of BlockTokenizerPostMatchPhaseState
 *
 * @param children
 */
export function calcPositionFromChildren(
  children?: ReadonlyArray<YastBlockState>
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
