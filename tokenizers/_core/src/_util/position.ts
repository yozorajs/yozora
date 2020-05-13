import {
  AsciiCodePoint,
  CodePoint,
  isPunctuationCharacter,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import {
  DataNodeTokenPointDetail,
  DataNodeTokenPosition,
} from '../_types/token'


/**
 * calc array of DataNodeTokenPointDetail from string
 */
export function calcDataNodeTokenPointDetail(
  content: string,
): DataNodeTokenPointDetail[] {
  const codePositions: DataNodeTokenPointDetail[] = []
  let offset = 0, column = 1, line = 1
  for (const c of content) {
    const codePoint: CodePoint = c.codePointAt(0)!
    codePositions.push({
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
  return codePositions
}


/**
 * calc string from codePoints
 * @param codePositions
 * @param startIndex
 * @param endIndex
 */
export function calcStringFromCodePoints(
  codePositions: DataNodeTokenPointDetail[],
  startIndex = 0,
  endIndex = codePositions.length,
): string {
  let value = ''
  for (let i = startIndex; i < endIndex; ++i) {
    const c = String.fromCodePoint(codePositions[i].codePoint)
    value += c
  }
  return value
}


/**
 * calc string from codePoints
 * @param codePositions
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#backslash-escapes
 */
export function calcStringFromCodePointsIgnoreEscapes(
  codePositions: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): string {
  const points: DataNodeTokenPointDetail[] = []
  for (let i = startIndex; i < endIndex; ++i) {
    const c = codePositions[i]
    if (c.codePoint === AsciiCodePoint.BACK_SLASH) {
      const d = codePositions[i + 1]
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
 * calc trim boundary
 * @param codePositions
 * @param startIndex
 * @param endIndex
 */
export function calcTrimBoundaryOfCodePoints(
  codePositions: DataNodeTokenPointDetail[],
  startIndex = 0,
  endIndex = codePositions.length,
): [number, number] {
  let leftIndex = startIndex, rightIndex = endIndex - 1
  for (; leftIndex <= rightIndex; ++leftIndex) {
    const c = codePositions[leftIndex]
    if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
  }
  for (; leftIndex <= rightIndex; --rightIndex) {
    const c = codePositions[rightIndex]
    if (!isUnicodeWhiteSpaceCharacter(c.codePoint)) break
  }
  return [leftIndex, rightIndex + 1]
}


/**
 * compare two DataTokenPosition (by <start, end>)
 * @param p1
 * @param p2
 */
export function comparePosition(
  p1: DataNodeTokenPosition,
  p2: DataNodeTokenPosition
): number {
  if (p1.left.start === p2.left.start) return p1.right.end - p2.right.end
  return p1.left.start - p2.left.start
}
