import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  isAsciiControlCharacter,
  isAsciiWhitespaceCharacter,
} from '@yozora/character'


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
  nodePoints: ReadonlyArray<NodePoint>,
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
            if (isAsciiWhitespaceCharacter(p.codePoint)) return i
            if (isAsciiControlCharacter(p.codePoint)) return i
            break
        }
      }
      return openParensCount === 0 ? i : -1
    }
  }
}
