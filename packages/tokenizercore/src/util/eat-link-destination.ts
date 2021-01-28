import type { EnhancedYastNodePoint } from '../types/node'
import {
  AsciiCodePoint,
  isAsciiControlCharacter,
  isAsciiWhiteSpaceCharacter,
} from '@yozora/character'
import { eatOptionalWhiteSpaces } from './eat-spaces'


/**
 * A link destination consists of either
 *  - a sequence of zero or more characters between an opening '<' and a closing '>'
 *    that contains no line breaks or unescaped '<' or '>' characters, or
 *  - a nonempty sequence of characters that does not start with '<', does not include
 *    ASCII space or control characters, and includes parentheses only if
 *    (a) they are backslash-escaped or
 *    (b) they are part of a balanced pair of unescaped parentheses. (Implementations
 *        may impose limits on parentheses nesting to avoid performance issues, but
 *        at least three levels of nesting should be supported.)
 * @see https://github.github.com/gfm/#link-destination
 * @return position at next iteration
 */
export function eatLinkDestination(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
): number {
  let i = startIndex
  switch (nodePoints[i].codePoint) {
    /**
      * In pointy brackets:
      *  - A sequence of zero or more characters between an opening '<' and
      *    a closing '>' that contains no line breaks or unescaped '<' or '>' characters
      */
    case AsciiCodePoint.OPEN_ANGLE: {
      for (i += 1; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACKSLASH:
            i += 1
            break
          case AsciiCodePoint.OPEN_ANGLE:
          case AsciiCodePoint.LF:
            return -1
          case AsciiCodePoint.CLOSE_ANGLE:
            return i + 1
        }
      }
      return -1
    }
    /**
     * Not in pointy brackets:
     *  - A nonempty sequence of characters that does not start with '<', does not include
     *    ASCII space or control characters, and includes parentheses only if
     *
     *    a) they are backslash-escaped or
     *    b) they are part of a balanced pair of unescaped parentheses. (Implementations
     *       may impose limits on parentheses nesting to avoid performance issues,
     *       but at least three levels of nesting should be supported.)
     */
    default: {
      let openParensCount = 0
      for (; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACKSLASH:
            i += 1
            break
          case AsciiCodePoint.OPEN_PARENTHESIS:
            openParensCount += 1
            break
          case AsciiCodePoint.CLOSE_PARENTHESIS:
            openParensCount -= 1
            if (openParensCount < 0) return i
            break
          default:
            if (isAsciiWhiteSpaceCharacter(p.codePoint)) return i
            if (isAsciiControlCharacter(p.codePoint)) return i
            break
        }
      }
      return openParensCount === 0 ? i : -1
    }
  }
}


/**
 * The processing state of eatAndCollectLinkDestination, used to save
 * intermediate data to support multiple codePosition fragment processing
 *
 * @see https://github.github.com/gfm/#link-destination
 */
export interface LinkDestinationCollectingState {
  /**
   * Whether the current state has collected a legal LinkDestination
   */
  saturated: boolean
  /**
   * Collected token points
   */
  nodePoints: EnhancedYastNodePoint[]
  /**
   * Whether an opening angle bracket has been matched
   */
  hasOpenAngleBracket: boolean
  /**
   * Number of parentheses encountered
   */
  openParensCount: number
}


/**
 *
 * @param nodePoints
 * @param startIndex
 * @param endIndex
 * @param state
 * @see https://github.github.com/gfm/#link-destination
 */
export function eatAndCollectLinkDestination(
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  startIndex: number,
  endIndex: number,
  state: LinkDestinationCollectingState | null,
): { nextIndex: number, state: LinkDestinationCollectingState } {
  let i = startIndex

  // init state
  if (state == null) {
    // eslint-disable-next-line no-param-reassign
    state = {
      saturated: false,
      nodePoints: [],
      hasOpenAngleBracket: false,
      openParensCount: 0,
    }
  }

  /**
   * Although link destination may span multiple lines,
   * they may not contain a blank line.
   */
  const firstNonWhitespaceIndex = eatOptionalWhiteSpaces(nodePoints, i, endIndex)
  if (firstNonWhitespaceIndex >= endIndex) return { nextIndex: -1, state }

  if (state.nodePoints.length <= 0) {
    i = firstNonWhitespaceIndex

    // check whether in pointy brackets
    const p = nodePoints[i]
    if (p.codePoint === AsciiCodePoint.OPEN_ANGLE) {
      i += 1
      // eslint-disable-next-line no-param-reassign
      state.hasOpenAngleBracket = true
      state.nodePoints.push(p)
    }
  }

  /**
    * In pointy brackets:
    *  - A sequence of zero or more characters between an opening '<' and
    *    a closing '>' that contains no line breaks or unescaped '<' or '>' characters
    */
  if (state.hasOpenAngleBracket) {
    for (; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          if (i + 1 < endIndex) {
            state.nodePoints.push(p)
            state.nodePoints.push(nodePoints[i + 1])
          }
          i += 1
          break
        case AsciiCodePoint.OPEN_ANGLE:
        case AsciiCodePoint.LF:
          return { nextIndex: -1, state }
        case AsciiCodePoint.CLOSE_ANGLE:
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          state.nodePoints.push(p)
          return { nextIndex: i + 1, state }
        default:
          state.nodePoints.push(p)
      }
    }
    return { nextIndex: i, state }
  }

  /**
   * Not in pointy brackets:
   *  - A nonempty sequence of characters that does not start with '<', does not include
   *    ASCII space or control characters, and includes parentheses only if
   *
   *    a) they are backslash-escaped or
   *    b) they are part of a balanced pair of unescaped parentheses. (Implementations
   *       may impose limits on parentheses nesting to avoid performance issues,
   *       but at least three levels of nesting should be supported.)
   */
  for (; i < endIndex; ++i) {
    const p = nodePoints[i]
    switch (p.codePoint) {
      case AsciiCodePoint.BACKSLASH:
        if (i + 1 < endIndex) {
          state.nodePoints.push(p)
          state.nodePoints.push(nodePoints[i + 1])
        }
        i += 1
        break
      case AsciiCodePoint.OPEN_PARENTHESIS:
        // eslint-disable-next-line no-param-reassign
        state.openParensCount += 1
        state.nodePoints.push(p)
        break
      case AsciiCodePoint.CLOSE_PARENTHESIS:
        // eslint-disable-next-line no-param-reassign
        state.openParensCount -= 1
        state.nodePoints.push(p)
        if (state.openParensCount < 0) {
          return { nextIndex: i, state }
        }
        break
      default:
        if (
          isAsciiWhiteSpaceCharacter(p.codePoint) ||
          isAsciiControlCharacter(p.codePoint)
        ) {
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          return { nextIndex: i, state }
        }
        state.nodePoints.push(p)
        break
    }
  }

  // eslint-disable-next-line no-param-reassign
  state.saturated = true
  return { nextIndex: i, state }
}
