import { AsciiCodePoint } from '../constant/ascii'
import { UnicodeCodePoint } from '../constant/unicode/unicode'
import { VirtualCodePoint } from '../constant/virtual'
import type { CodePoint, NodePoint } from '../types'
import { isWhitespaceCharacter } from './character'
import { isAsciiPunctuationCharacter } from './charset/ascii'
import { eatEntityReference } from './entity-reference'

/**
 * Create a generator to processing string stream.
 */
export function* createNodePointGenerator(
  initialContent: string,
): Iterator<NodePoint[], null, string | null> {
  let offset = 0,
    column = 1,
    line = 1

  let content: string | null = initialContent
  while (content != null) {
    // Get code points.
    const codePoints: CodePoint[] = []
    for (const c of content) {
      const codePoint: CodePoint = c.codePointAt(0)!
      codePoints.push(codePoint)
    }

    // Calc node points.
    const nodePoints: NodePoint[] = []
    const endIndex = codePoints.length
    for (let i = 0; i < endIndex; ++i) {
      const codePoint: CodePoint = codePoints[i]
      switch (codePoint) {
        /**
         * Expand tab to four spaces.
         * @see https://github.github.com/gfm/#tabs
         */
        case AsciiCodePoint.HT:
          for (let i = 0; i < 4; ++i) {
            nodePoints.push({
              line,
              column,
              offset,
              codePoint: VirtualCodePoint.SPACE,
            })
          }
          offset += 1
          column += 1
          break
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

          if (i + 1 < endIndex && codePoints[i + 1] === AsciiCodePoint.LF) {
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
        default:
          nodePoints.push({ line, column, offset, codePoint })
          offset += 1
          column += 1
          break
      }
    }

    content = yield nodePoints
    if (content == null) break
  }
  return null
}

/**
 * Create a string from nodePoints.
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @param trim
 */
export function calcStringFromNodePoints(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex = 0,
  endIndex = nodePoints.length,
  trim = false,
): string {
  if (trim) {
    // eslint-disable-next-line no-param-reassign
    ;[startIndex, endIndex] = calcTrimBoundaryOfCodePoints(
      nodePoints,
      startIndex,
      endIndex,
    )
  }

  let result = ''
  for (let i = startIndex, j; i < endIndex; ++i) {
    const c = nodePoints[i].codePoint
    switch (c) {
      // Handle tabs.
      case VirtualCodePoint.SPACE: {
        for (j = i + 1; j < endIndex; ++j) {
          if (nodePoints[j].codePoint !== VirtualCodePoint.SPACE) break
        }

        // Every four virtual spaces on the right form a tab character.
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
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex = 0,
  endIndex: number = nodePoints.length,
  trim = false,
): string {
  if (trim) {
    // eslint-disable-next-line no-param-reassign
    ;[startIndex, endIndex] = calcTrimBoundaryOfCodePoints(
      nodePoints,
      startIndex,
      endIndex,
    )
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
        continue
      }
    }

    switch (c) {
      // Handle tabs.
      case VirtualCodePoint.SPACE: {
        for (j = i + 1; j < endIndex; ++j) {
          if (nodePoints[j].codePoint !== VirtualCodePoint.SPACE) break
        }

        // Every four virtual spaces on the right form a tab character.
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
  nodePoints: ReadonlyArray<NodePoint>,
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
