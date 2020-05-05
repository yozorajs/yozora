import {
  AsciiCodePoint,
  isPunctuationCharacter,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import { DataNodeTokenPointDetail, DataNodeTokenPosition } from '../_types/token'


/**
 * calc array of DataNodeTokenPointDetail from string
 */
export function calcDataNodeTokenPointDetail(content: string): DataNodeTokenPointDetail[] {
  const codePoints: DataNodeTokenPointDetail[] = []
  let offset = 0, column = 1, line = 1
  for (const c of content) {
    const codePoint: number = c.codePointAt(0)!
    codePoints.push({
      codePoint,
      offset,
      column,
      line,
    })

    ++offset, ++column
    if (codePoint === AsciiCodePoint.LINE_FEED) {
      column = 1
      ++line
    }
  }
  return codePoints
}


/**
 * calc string from codePoints
 * @param codePoints
 * @param start
 * @param end
 */
export function calcStringFromCodePoints(
  codePoints: DataNodeTokenPointDetail[],
  start = 0,
  end: number = codePoints.length,
): string {
  let value = ''
  for (let i = start; i < end; ++i) {
    const c = String.fromCodePoint(codePoints[i].codePoint)
    value += c
  }
  return value
}


/**
 * calc trim boundary
 * @param codePoints
 * @param start
 * @param end
 */
export function calcTrimBoundaryOfCodePoints(
  codePoints: DataNodeTokenPointDetail[],
  start = 0,
  end: number = codePoints.length,
): [number, number] {
  let leftIndex = start, rightIndex = end - 1
  for (; leftIndex <= rightIndex; ++leftIndex) {
    const c = codePoints[leftIndex]
    if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
  }
  for (; leftIndex <= rightIndex; --rightIndex) {
    const c = codePoints[rightIndex]
    if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
  }
  return [leftIndex, rightIndex + 1]
}


/**
 * calc string from codePoints
 * @param codePoints
 * @param start
 * @param end
 * @see https://github.github.com/gfm/#backslash-escapes
 */
export function calcStringFromCodePointsIgnoreEscapes(
  codePoints: DataNodeTokenPointDetail[],
  start: number,
  end: number,
): string {
  const points: DataNodeTokenPointDetail[] = []
  for (let i = start; i < end; ++i) {
    const c = codePoints[i]
    if (c.codePoint === AsciiCodePoint.BACK_SLASH) {
      const d = codePoints[i + 1]
      /**
       * Any ASCII punctuation character may be backslash-escaped
       * @see https://github.github.com/gfm/#example-308
       */
      if (d != null && isPunctuationCharacter(d.codePoint)) {
        ++i
        points.push(d)
        continue
      }
    }
    points.push(c)
  }
  const value: string = points
    .map(({ codePoint: c }) => String.fromCodePoint(c))
    .join('')
  return value
}


/**
 * compare two DataTokenPosition (by <start, end>)
 * @param p1
 * @param p2
 */
export function comparePosition (p1: DataNodeTokenPosition, p2: DataNodeTokenPosition): number {
  if (p1.left.start === p2.left.start) return p1.right.end - p2.right.end
  return p1.left.start - p2.left.start
}
