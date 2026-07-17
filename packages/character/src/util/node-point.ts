import { AsciiCodePoint } from '../constant/ascii'
import { UnicodeCodePoint } from '../constant/unicode/unicode'
import { VirtualCodePoint } from '../constant/virtual'
import type { ICodePoint, INodePoint } from '../types'
import { isWhitespaceCharacter } from './character'
import { isAsciiPunctuationCharacter } from './charset/ascii'
import { eatEntityReference } from './entity-reference'

/**
 * Keep CRLF and UTF-16 surrogate pairs intact across string chunks.
 */
function* mergeBoundaryCodeUnits(chunks: Iterable<string>): Iterable<string> {
  let pending = ''

  for (const chunk of chunks) {
    let content = pending + chunk
    pending = ''

    if (content.length > 0) {
      const lastIndex = content.length - 1
      const lastCodeUnit = content.charCodeAt(lastIndex)
      const shouldWait =
        lastCodeUnit === AsciiCodePoint.CR || (lastCodeUnit >= 0xd800 && lastCodeUnit <= 0xdbff)

      if (shouldWait) {
        pending = content[lastIndex]
        content = content.slice(0, lastIndex)
      }
    }

    yield content
  }

  if (pending.length > 0) yield pending
}

/**
 * Create a generator to processing string stream.
 */
export function* createNodePointGenerator(
  literalStrings: Iterable<string> | string,
): Iterable<INodePoint[]> & Iterator<INodePoint[], undefined> {
  let offset = 0
  let column = 1
  let line = 1

  const contents =
    typeof literalStrings === 'string' ? [literalStrings] : mergeBoundaryCodeUnits(literalStrings)

  for (const content of contents) {
    const nodePoints: INodePoint[] = []
    for (let i = 0; i < content.length;) {
      const codePoint: ICodePoint = content.codePointAt(i)!
      const width = codePoint > 0xffff ? 2 : 1
      i += width

      switch (codePoint) {
        /**
         * Expand tab to four spaces.
         * @see https://github.github.com/gfm/#tabs
         */
        case AsciiCodePoint.HT: {
          const point: INodePoint = {
            line,
            column,
            offset,
            codePoint: VirtualCodePoint.SPACE,
          }

          /**
           * INodePoint is readonly, so four virtual indices can share one point.
           */
          nodePoints.push(point, point, point, point)
          offset += 1
          column += 1
          break
        }
        /**
         * A line is a sequence of zero or more characters other than newline
         * (U+000A) or carriage return (U+000D), followed by a line ending or
         * by the end of file.
         *
         * A line ending is a newline (U+000A), a carriage return (U+000D) not
         * followed by a newline, or a carriage return and a following newline.
         *
         * @see https://github.github.com/gfm/#line
         * @see https://github.github.com/gfm/#line-ending
         */
        case AsciiCodePoint.LF:
          nodePoints.push({
            line,
            column,
            offset,
            codePoint: VirtualCodePoint.LINE_END,
          })
          offset += 1
          column = 1
          line += 1
          break
        case AsciiCodePoint.CR:
          nodePoints.push({
            line,
            column,
            offset,
            codePoint: VirtualCodePoint.LINE_END,
          })
          offset += 1
          column = 1
          line += 1

          if (i < content.length && content.charCodeAt(i) === AsciiCodePoint.LF) {
            offset += 1
            i += 1
          }
          break
        /**
         * For security reasons, the Unicode character U+0000 must be replaced
         * with the REPLACEMENT CHARACTER (U+FFFD).
         */
        case AsciiCodePoint.NUL:
          nodePoints.push({
            line,
            column,
            offset,
            codePoint: UnicodeCodePoint.REPLACEMENT_CHARACTER,
          })
          offset += 1
          column += 1
          break
        default: {
          nodePoints.push({ line, column, offset, codePoint })
          // Source positions follow JavaScript string indices and use UTF-16
          // code units. Other source representations should adapt this width.
          offset += width
          column += width
          break
        }
      }
    }
    yield nodePoints
  }
  return
}

/**
 * Create a string from nodePoints.
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @param trim
 */
export function calcStringFromNodePoints(
  nodePoints: readonly INodePoint[],
  startIndex = 0,
  endIndex = nodePoints.length,
  trim = false,
): string {
  if (trim) {
    ;[startIndex, endIndex] = calcTrimBoundaryOfCodePoints(nodePoints, startIndex, endIndex)
  }

  let result = ''
  for (let i = startIndex, j; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    switch (c) {
      // Handle tabs.
      case VirtualCodePoint.SPACE: {
        const offset = nodePoints[i].offset
        for (j = i + 1; j < endIndex; ++j) {
          const point = nodePoints[j]
          if (point.codePoint !== VirtualCodePoint.SPACE || point.offset !== offset) break
        }

        // Four virtual spaces from the same source offset form one tab.
        const tabCount = (j - i) >> 2
        const spaceCount = (j - i) & 3
        for (let k = 0; k < spaceCount; ++k) result += ' '
        for (let k = 0; k < tabCount; ++k) result += '\t'
        i = j - 1
        break
      }
      // Handle line end.
      case VirtualCodePoint.LINE_END: {
        result += '\n'
        break
      }
      default:
        result += String.fromCodePoint(c)
    }
  }
  return result
}

/**
 * Create a string from nodePoints and escape backslashes.
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @see https://github.github.com/gfm/#backslash-escapes
 */
export function calcEscapedStringFromNodePoints(
  nodePoints: readonly INodePoint[],
  startIndex = 0,
  endIndex: number = nodePoints.length,
  trim = false,
): string {
  if (trim) {
    ;[startIndex, endIndex] = calcTrimBoundaryOfCodePoints(nodePoints, startIndex, endIndex)
  }

  let result = ''
  for (let i = startIndex, j; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    if (c === AsciiCodePoint.BACKSLASH && i + 1 < endIndex) {
      const d = nodePoints[i + 1].codePoint

      /**
       * Any ASCII punctuation character may be backslash-escaped.
       * @see https://github.github.com/gfm/#example-308
       */
      if (isAsciiPunctuationCharacter(d)) {
        i += 1
        result += String.fromCodePoint(d)
      } else {
        result += '\\'
      }
      continue
    }

    switch (c) {
      // Handle tabs.
      case VirtualCodePoint.SPACE: {
        const offset = nodePoints[i].offset
        for (j = i + 1; j < endIndex; ++j) {
          const point = nodePoints[j]
          if (point.codePoint !== VirtualCodePoint.SPACE || point.offset !== offset) break
        }

        // Four virtual spaces from the same source offset form one tab.
        const tabCount = (j - i) >> 2
        const spaceCount = (j - i) & 3
        for (let k = 0; k < spaceCount; ++k) result += ' '
        for (let k = 0; k < tabCount; ++k) result += '\t'
        i = j - 1
        break
      }
      // Handle line end.
      case VirtualCodePoint.LINE_END: {
        result += '\n'
        break
      }
      // Resolve entity references.
      case AsciiCodePoint.AMPERSAND: {
        const entityReference = eatEntityReference(nodePoints, i + 1, endIndex)
        if (entityReference == null) result += '&'
        else {
          result += entityReference.value
          i = entityReference.nextIndex - 1
        }
        break
      }
      default:
        result += String.fromCodePoint(c)
    }
  }
  return result
}

/**
 * Calc trim boundary.
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 */
export function calcTrimBoundaryOfCodePoints(
  nodePoints: readonly INodePoint[],
  startIndex = 0,
  endIndex = nodePoints.length,
): [number, number] {
  let leftIndex = startIndex,
    rightIndex = endIndex - 1
  for (; leftIndex <= rightIndex; ++leftIndex) {
    const p = nodePoints[leftIndex]
    if (!isWhitespaceCharacter(p.codePoint)) break
  }
  for (; leftIndex <= rightIndex; --rightIndex) {
    const p = nodePoints[rightIndex]
    if (!isWhitespaceCharacter(p.codePoint)) break
  }
  return [leftIndex, rightIndex + 1]
}
