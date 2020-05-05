import {
  AsciiCodePoint,
  isAsciiControlCharacter,
  isWhiteSpaceCharacter,
} from '@yozora/character'
import { DataNodeTokenPointDetail } from '../_types/token'
import { eatOptionalBlankLines } from './eat'


/**
 * A link label begins with a left bracket '[' and ends with the first right bracket ']'
 * that is not backslash-escaped. Between these brackets there must be at least one
 * non-whitespace character. Unescaped square bracket characters are not allowed inside
 * the opening and closing square brackets of link labels. A link label can have at most
 * 999 characters inside the square brackets.
 *
 * One label matches another just in case their normalized forms are equal. To normalize
 * a label, strip off the opening and closing brackets, perform the Unicode case fold,
 * strip leading and trailing whitespace and collapse consecutive internal whitespace to
 * a single space. If there are multiple matching reference link definitions, the one that
 * comes first in the document is used. (It is desirable in such cases to emit a warning.)
 * @see https://github.github.com/gfm/#link-label
 * @return position at next iteration
 */
export function eatLinkLabel(
  codePoints: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  let hasNonWhiteSpaceCharacter = false, c = 0
  for (let i = startIndex; i < endIndex && c < 999; ++i, ++c) {
    const p = codePoints[i]
    if (!hasNonWhiteSpaceCharacter) hasNonWhiteSpaceCharacter = !isWhiteSpaceCharacter(p.codePoint)
    switch (p.codePoint) {
      case AsciiCodePoint.BACK_SLASH:
        ++i
        break
      case AsciiCodePoint.OPEN_BRACKET:
        return -1
      case AsciiCodePoint.CLOSE_BRACKET:
        if (i === startIndex || hasNonWhiteSpaceCharacter) return i
        return -1
    }
  }
  return -1
}


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
  codePoints: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  let i = startIndex
  switch (codePoints[i].codePoint) {
    /**
      * In pointy brackets:
      *  - A sequence of zero or more characters between an opening '<' and
      *    a closing '>' that contains no line breaks or unescaped '<' or '>' characters
      */
    case AsciiCodePoint.OPEN_ANGLE: {
      let inPointyBrackets = true
      for (++i; inPointyBrackets && i < endIndex; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            ++i
            break
          case AsciiCodePoint.OPEN_ANGLE:
          case AsciiCodePoint.LINE_FEED:
            return -1
          case AsciiCodePoint.CLOSE_ANGLE:
            inPointyBrackets = false
            break
        }
      }
      if (inPointyBrackets) return -1
      return i
    }
    case AsciiCodePoint.CLOSE_PARENTHESIS:
      return i
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
      let inDestination = true
      let openParensCount = 1
      for (; inDestination && i < endIndex; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            ++i
            break
          case AsciiCodePoint.OPEN_PARENTHESIS:
            ++openParensCount
            break
          case AsciiCodePoint.CLOSE_PARENTHESIS:
            --openParensCount
            if (openParensCount > 0) break
          case AsciiCodePoint.HORIZONTAL_TAB:
          case AsciiCodePoint.LINE_FEED:
          case AsciiCodePoint.SPACE:
            inDestination = false
            --i
            break
          default:
            if (isAsciiControlCharacter(p.codePoint)) return -1
            break
        }
      }
      if (inDestination || openParensCount < 0 || openParensCount > 1) return -1
      return i
    }
  }
}


/**
  * A link title consists of either
  * - a sequence of zero or more characters between straight double-quote characters '"',
  *   including a '"' character only if it is backslash-escaped, or
  * - a sequence of zero or more characters between straight single-quote characters '\'',
  *   including a '\'' character only if it is backslash-escaped, or
  * - a sequence of zero or more characters between matching parentheses '(...)',
  *   including a '(' or ')' character only if it is backslash-escaped.
  *
  * Although link titles may span multiple lines, they may not contain a blank line.
  */
export function eatLinkTitle(
  codePoints: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
): number {
  let i = startIndex
  const titleWrapSymbol = codePoints[i].codePoint
  switch (titleWrapSymbol) {
    /**
     *  - a sequence of zero or more characters between straight double-quote characters '"',
     *    including a '"' character only if it is backslash-escaped, or
     *  - a sequence of zero or more characters between straight single-quote characters '\'',
     *    including a '\'' character only if it is backslash-escaped,
     */
    case AsciiCodePoint.DOUBLE_QUOTE:
    case AsciiCodePoint.SINGLE_QUOTE: {
      for (++i; i < endIndex; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            ++i
            break
          case titleWrapSymbol:
            return i + 1
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case AsciiCodePoint.LINE_FEED: {
            const j = eatOptionalBlankLines(codePoints, startIndex, i)
            if (codePoints[j].line > p.line + 1) return -1
            break
          }
        }
      }
      break
    }
    /**
     * a sequence of zero or more characters between matching parentheses '((...))',
     * including a '(' or ')' character only if it is backslash-escaped.
     */
    case AsciiCodePoint.OPEN_PARENTHESIS: {
      let openParens = 1
      for (++i; i < endIndex; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            ++i
            break
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case AsciiCodePoint.LINE_FEED: {
            const j = eatOptionalBlankLines(codePoints, startIndex, i)
            if (codePoints[j].line > p.line + 1) return -1
            break
          }
          case AsciiCodePoint.OPEN_PARENTHESIS:
            ++openParens
            break
          case AsciiCodePoint.CLOSE_PARENTHESIS:
            --openParens
            if (openParens === 0) return i + 1
            break
        }
      }
      break
    }
    case AsciiCodePoint.CLOSE_PARENTHESIS:
      return i
    default:
      return -1
  }
  return -1
}
