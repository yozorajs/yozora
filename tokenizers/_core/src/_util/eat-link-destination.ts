import {
  AsciiCodePoint,
  isAsciiControlCharacter,
  isAsciiWhiteSpaceCharacter,
} from '@yozora/character'
import { DataNodeTokenPointDetail } from '../_types/token'
import { eatOptionalWhiteSpaces } from './eat'


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
  codePositions: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  let i = startIndex
  switch (codePositions[i].codePoint) {
    /**
      * In pointy brackets:
      *  - A sequence of zero or more characters between an opening '<' and
      *    a closing '>' that contains no line breaks or unescaped '<' or '>' characters
      */
    case AsciiCodePoint.OPEN_ANGLE: {
      for (i += 1; i < endIndex; ++i) {
        const c = codePositions[i]
        switch (c.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          case AsciiCodePoint.OPEN_ANGLE:
          case AsciiCodePoint.LINE_FEED:
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
        const c = codePositions[i]
        switch (c.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
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
            if (isAsciiWhiteSpaceCharacter(c.codePoint)) return i
            if (isAsciiControlCharacter(c.codePoint)) return i
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
  codePositions: DataNodeTokenPointDetail[]
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
 * @param codePositions
 * @param startIndex
 * @param endIndex
 * @param state
 * @see https://github.github.com/gfm/#link-destination
 */
export function eatAndCollectLinkDestination(
  codePositions: DataNodeTokenPointDetail[],
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
      codePositions: [],
      hasOpenAngleBracket: false,
      openParensCount: 0,
    }
  }

  /**
   * Although link destination may span multiple lines,
   * they may not contain a blank line.
   */
  const firstNonWhiteSpaceIndex = eatOptionalWhiteSpaces(codePositions, i, endIndex)
  if (firstNonWhiteSpaceIndex >= endIndex) return { nextIndex: -1, state }

  if (state.codePositions.length <= 0) {
    i = firstNonWhiteSpaceIndex

    // check whether in pointy brackets
    const c = codePositions[i]
    if (c.codePoint === AsciiCodePoint.OPEN_ANGLE) {
      i += 1
      // eslint-disable-next-line no-param-reassign
      state.hasOpenAngleBracket = true
      state.codePositions.push(c)
    }
  }

  /**
    * In pointy brackets:
    *  - A sequence of zero or more characters between an opening '<' and
    *    a closing '>' that contains no line breaks or unescaped '<' or '>' characters
    */
  if (state.hasOpenAngleBracket) {
    for (; i < endIndex; ++i) {
      const c = codePositions[i]
      switch (c.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          if (i + 1 < endIndex) {
            state.codePositions.push(c)
            state.codePositions.push(codePositions[i + 1])
          }
          i += 1
          break
        case AsciiCodePoint.OPEN_ANGLE:
        case AsciiCodePoint.LINE_FEED:
          return { nextIndex: -1, state }
        case AsciiCodePoint.CLOSE_ANGLE:
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          state.codePositions.push(c)
          return { nextIndex: i + 1, state }
        default:
          state.codePositions.push(c)
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
    const c = codePositions[i]
    switch (c.codePoint) {
      case AsciiCodePoint.BACK_SLASH:
        if (i + 1 < endIndex) {
          state.codePositions.push(c)
          state.codePositions.push(codePositions[i + 1])
        }
        i += 1
        break
      case AsciiCodePoint.OPEN_PARENTHESIS:
        // eslint-disable-next-line no-param-reassign
        state.openParensCount += 1
        state.codePositions.push(c)
        break
      case AsciiCodePoint.CLOSE_PARENTHESIS:
        // eslint-disable-next-line no-param-reassign
        state.openParensCount -= 1
        state.codePositions.push(c)
        if (state.openParensCount < 0) {
          return { nextIndex: i , state }
        }
        break
      default:
        if (
          isAsciiWhiteSpaceCharacter(c.codePoint) ||
          isAsciiControlCharacter(c.codePoint)
        ) {
          // eslint-disable-next-line no-param-reassign
          state.saturated = true
          return { nextIndex: i, state }
        }
        state.codePositions.push(c)
        break
    }
  }

  // eslint-disable-next-line no-param-reassign
  state.saturated = true
  return { nextIndex: i, state }
}
