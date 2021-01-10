import type { EnhancedYastNodePoint, YastNodePoint } from '../types/node'
import {
  AsciiCodePoint,
  CodePoint,
  isPunctuationCharacter,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'


/**
 * Create an array of EnhancedYastNodePoint from string.
 *
 * Recommendation: first replace line breaks with LF before calling this function
 */
export function calcEnhancedYastNodePoints(content: string): EnhancedYastNodePoint[] {
  const nodePoints: EnhancedYastNodePoint[] = []

  let offset = 0, column = 1, line = 1
  for (const c of content) {
    const codePoint: CodePoint = c.codePointAt(0)!
    nodePoints.push({
      line,
      column,
      offset,
      codePoint,
    })

    offset += 1
    column += 1
    if (codePoint === AsciiCodePoint.LINE_FEED) {
      column = 1
      line += 1
    }
  }
  return nodePoints
}


/**
 * Resolve a YastNodePoint from EnhancedNodePoint list.
 *
 * @param nodePoints
 * @param index
 */
export function calcYastNodePoint(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  index: number,
): YastNodePoint {
  // If the index does exceed the boundary of the list,
  // create and return a virtual YastNodePoint.
  if (index >= nodePoints.length) {
    if (nodePoints.length <= 0) {
      return { line: 1, column: 1, offset: 0 }
    }

    const { line, column, offset } = nodePoints[nodePoints.length - 1]
    return {
      line,
      column: column + 1,
      offset: offset + 1,
    }
  }

  // Otherwise, return the element pointed by this index of the list.
  const { line, column, offset } = nodePoints[index]
  return { line, column, offset }
}


/**
 * Create a string from nodePoints.
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
export function calcStringFromNodePoints(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex = 0,
  endIndex = nodePoints.length,
): string {
  let value = ''
  for (let i = startIndex; i < endIndex; ++i) {
    const c = String.fromCodePoint(nodePoints[i].codePoint)
    value += c
  }
  return value
}


/**
 * Create a string from nodePoints.
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#backslash-escapes
 */
export function calcStringFromNodePointsIgnoreEscapes(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): string {
  let value = ''
  for (let i = startIndex; i < endIndex; ++i) {
    const p = nodePoints[i]
    if (p.codePoint === AsciiCodePoint.BACK_SLASH) {
      const q = nodePoints[i + 1]
      /**
       * Any ASCII punctuation character may be backslash-escaped.
       * @see https://github.github.com/gfm/#example-308
       */
      if (q != null && isPunctuationCharacter(q.codePoint)) {
        i += 1
        value += String.fromCodePoint(q.codePoint)
        continue
      }
    }
    value += String.fromCodePoint(p.codePoint)
  }
  return value
}


/**
 * Calc trim boundary.
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
export function calcTrimBoundaryOfCodePoints(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex = 0,
  endIndex = nodePoints.length,
): [number, number] {
  let leftIndex = startIndex, rightIndex = endIndex - 1
  for (; leftIndex <= rightIndex; ++leftIndex) {
    const p = nodePoints[leftIndex]
    if (!isUnicodeWhiteSpaceCharacter(p.codePoint)) break
  }
  for (; leftIndex <= rightIndex; --rightIndex) {
    const p = nodePoints[rightIndex]
    if (!isUnicodeWhiteSpaceCharacter(p.codePoint)) break
  }
  return [leftIndex, rightIndex + 1]
}
