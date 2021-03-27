import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  VirtualCodePoint,
  isAsciiControlCharacter,
  isWhitespaceCharacter,
} from '@yozora/character'
import { eatOptionalWhitespaces } from '@yozora/core-tokenizer'

/**
 * The processing token of eatAndCollectLinkDestination, used to save
 * intermediate data to support multiple codePosition fragment processing
 *
 * @see https://github.github.com/gfm/#link-destination
 */
export interface LinkDestinationCollectingState {
  /**
   * Whether the current token has collected a legal LinkDestination
   */
  saturated: boolean
  /**
   * Collected token points
   */
  nodePoints: NodePoint[]
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
 * @param token
 * @see https://github.github.com/gfm/#link-destination
 */
export function eatAndCollectLinkDestination(
  nodePoints: ReadonlyArray<NodePoint>,
  startIndex: number,
  endIndex: number,
  token: LinkDestinationCollectingState | null,
): { nextIndex: number; token: LinkDestinationCollectingState } {
  let i = startIndex

  // init token
  if (token == null) {
    // eslint-disable-next-line no-param-reassign
    token = {
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
  const firstNonWhitespaceIndex = eatOptionalWhitespaces(
    nodePoints,
    i,
    endIndex,
  )
  if (firstNonWhitespaceIndex >= endIndex) return { nextIndex: -1, token }

  if (token.nodePoints.length <= 0) {
    i = firstNonWhitespaceIndex

    // check whether in pointy brackets
    const p = nodePoints[i]
    if (p.codePoint === AsciiCodePoint.OPEN_ANGLE) {
      i += 1
      // eslint-disable-next-line no-param-reassign
      token.hasOpenAngleBracket = true
      token.nodePoints.push(p)
    }
  }

  /**
   * In pointy brackets:
   *  - A sequence of zero or more characters between an opening '<' and
   *    a closing '>' that contains no line breaks or unescaped '<' or '>' characters
   */
  if (token.hasOpenAngleBracket) {
    for (; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          if (i + 1 < endIndex) {
            token.nodePoints.push(p)
            token.nodePoints.push(nodePoints[i + 1])
          }
          i += 1
          break
        case AsciiCodePoint.OPEN_ANGLE:
        case VirtualCodePoint.LINE_END:
          return { nextIndex: -1, token }
        case AsciiCodePoint.CLOSE_ANGLE:
          // eslint-disable-next-line no-param-reassign
          token.saturated = true
          token.nodePoints.push(p)
          return { nextIndex: i + 1, token }
        default:
          token.nodePoints.push(p)
      }
    }
    return { nextIndex: i, token }
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
          token.nodePoints.push(p)
          token.nodePoints.push(nodePoints[i + 1])
        }
        i += 1
        break
      case AsciiCodePoint.OPEN_PARENTHESIS:
        // eslint-disable-next-line no-param-reassign
        token.openParensCount += 1
        token.nodePoints.push(p)
        break
      case AsciiCodePoint.CLOSE_PARENTHESIS:
        // eslint-disable-next-line no-param-reassign
        token.openParensCount -= 1
        token.nodePoints.push(p)
        if (token.openParensCount < 0) {
          return { nextIndex: i, token }
        }
        break
      default:
        if (
          isWhitespaceCharacter(p.codePoint) ||
          isAsciiControlCharacter(p.codePoint)
        ) {
          // eslint-disable-next-line no-param-reassign
          token.saturated = true
          return { nextIndex: i, token }
        }
        token.nodePoints.push(p)
        break
    }
  }

  // eslint-disable-next-line no-param-reassign
  token.saturated = true
  return { nextIndex: i, token }
}
