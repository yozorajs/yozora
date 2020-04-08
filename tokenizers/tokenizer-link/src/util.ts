import {
  CodePoint,
  DataNodeTokenPointDetail,
  eatOptionalBlankLines,
  isASCIIControlCharacter,
} from '@yozora/tokenizer-core'
import { LinkMatchState} from './tokenizer'


/**
 * A link text consists of a sequence of zero or more inline elements enclosed
 * by square brackets ('[' and ']'). The following rules apply:
 *  - Links may not contain other links, at any level of nesting.
 *    If multiple otherwise valid link definitions appear nested inside each other,
 *    the inner-most definition is used.
 *  - Brackets are allowed in the link text only if
 *    (a) they are backslash-escaped or
 *    (b) they appear as a matched pair of brackets, with an open bracket '[',
 *        a sequence of zero or more inlines, and a close bracket ']'.
 * @see https://github.github.com/gfm/#link-text
 * @return position at next iteration
 */
export function eatLinkText(
  codePoints: DataNodeTokenPointDetail[],
  state: LinkMatchState,
  openBracketPoint: DataNodeTokenPointDetail,
  closeBracketPoint: DataNodeTokenPointDetail,
): number {
  /**
   * 将其置为左边界，即便此前已经存在左边界 (state.leftFlanking != null)；
   * 因为必然是先找到了中间边界，且尚未找到对应的右边界，说明之前的左边界和
   * 中间边界是无效的
   */
  const obp = openBracketPoint
  const cbp = closeBracketPoint
  // eslint-disable-next-line no-param-reassign
  state.leftFlanking = {
    start: obp.offset,
    end: obp.offset + 1,
    thickness: 1,
  }
  // eslint-disable-next-line no-param-reassign
  state.middleFlanking = {
    start: cbp.offset,
    end: cbp.offset + 2,
    thickness: 2,
  }
  return state.middleFlanking.end
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
  state: LinkMatchState,
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
    case CodePoint.OPEN_ANGLE: {
      let inPointyBrackets = true
      for (++i; inPointyBrackets && i < endIndex; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case CodePoint.BACK_SLASH:
            ++i
            break
          case CodePoint.OPEN_ANGLE:
          case CodePoint.LINE_FEED:
            return -1
          case CodePoint.CLOSE_ANGLE:
            inPointyBrackets = false
            break
        }
      }
      if (inPointyBrackets) return -1
      return i
    }
    case CodePoint.CLOSE_PARENTHESIS:
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
          case CodePoint.BACK_SLASH:
            ++i
            break
          case CodePoint.OPEN_PARENTHESIS:
            ++openParensCount
            break
          case CodePoint.CLOSE_PARENTHESIS:
            --openParensCount
            if (openParensCount > 0) break
          case CodePoint.TAB:
          case CodePoint.LINE_FEED:
          case CodePoint.SPACE:
            inDestination = false
            --i
            break
          default:
            if (isASCIIControlCharacter(p.codePoint)) return -1
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
  state: LinkMatchState,
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
    case CodePoint.DOUBLE_QUOTE:
    case CodePoint.SINGLE_QUOTE: {
      for (++i; i < endIndex; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case CodePoint.BACK_SLASH:
            ++i
            break
          case titleWrapSymbol:
            return i + 1
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case CodePoint.LINE_FEED: {
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
    case CodePoint.OPEN_PARENTHESIS: {
      let openParens = 1
      for (++i; i < endIndex; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case CodePoint.BACK_SLASH:
            ++i
            break
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case CodePoint.LINE_FEED: {
            const j = eatOptionalBlankLines(codePoints, startIndex, i)
            if (codePoints[j].line > p.line + 1) return -1
            break
          }
          case CodePoint.OPEN_PARENTHESIS:
            ++openParens
            break
          case CodePoint.CLOSE_PARENTHESIS:
            --openParens
            if (openParens === 0) return i + 1
            break
        }
      }
      break
    }
    case CodePoint.CLOSE_PARENTHESIS:
      return i
    default:
      return -1
  }
  return -1
}
