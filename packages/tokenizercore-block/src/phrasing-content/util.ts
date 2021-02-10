import type { YastNodePosition } from '@yozora/tokenizercore'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentState,
} from './types'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import { mergeContentLinesAndStrippedLines } from '../util'
import { PhrasingContentType } from './types'


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
 * Stripped preceding and tailing blank lines.
 */
export function trimBlankLines(
  lines: ReadonlyArray<PhrasingContentLine>
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
