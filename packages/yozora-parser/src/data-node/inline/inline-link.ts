import {
  CodePoint,
  InlineDataNodeType,
  DataNodeTokenPosition,
  DataNodeTokenPoint,
  DataNodeTokenFlankingGraph,
  buildGraphFromThreeFlanking,
  isASCIIControlCharacter,
  eatBlankLines,
  eatWhiteSpaces,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


const T = InlineDataNodeType.INLINE_LINK
type T = typeof T


/**
 * Lexical Analyzer for InlineLinkDataNode
 *
 * An inline link consists of a link text followed immediately by a left parenthesis '(',
 * optional whitespace, an optional link destination, an optional link title separated from
 * the link destination by whitespace, optional whitespace, and a right parenthesis ')'.
 * The link’s text consists of the inlines contained in the link text (excluding the
 * enclosing square brackets).
 * The link’s URI consists of the link destination, excluding enclosing '<...>' if present,
 * with backslash-escapes in effect as described above. The link’s title consists of the
 * link title, excluding its enclosing delimiters, with backslash-escapes in effect as
 * described above
 * @see https://github.github.com/gfm/#links
 */
export class InlineLinkTokenizer
  extends BaseInlineDataNodeTokenizer<T>
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  public match(codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    const leftFlanking = self.matchLeftFlanking(codePoints)
    const middleFlanking = self.matchMiddleFlanking(codePoints)
    const rightFlanking = self.matchRightFlanking(middleFlanking, codePoints)
    const result = buildGraphFromThreeFlanking(
      self.type, leftFlanking, middleFlanking, rightFlanking)
    return result
  }

  /**
   * get all left borders (pattern: /\[/)
   * @param codePoints
   */
  protected matchLeftFlanking(codePoints: number[]): DataNodeTokenPosition[] {
    const results: DataNodeTokenPosition[] = []
    for (let offset = 0, column = 1, line = 1; offset < codePoints.length; ++offset, ++column) {
      const c = codePoints[offset]
      switch (c) {
        case CodePoint.BACK_SLASH:
          ++offset
          ++column
          break
        case CodePoint.LINE_FEED:
          column = 0
          ++line
          break
        case CodePoint.OPEN_BRACKET: {
          const start: DataNodeTokenPoint = { offset, column, line }
          const end: DataNodeTokenPoint = { offset: offset + 1, column: column + 1, line }
          const result: DataNodeTokenPosition = { start, end }
          results.push(result)
          break
        }
      }
    }
    return results
  }

  /**
   * get all middle borders (pattern: /\]\(/)
   * @param codePoints
   */
  protected matchMiddleFlanking(codePoints: number[]): DataNodeTokenPosition[] {
    const results: DataNodeTokenPosition[] = []
    for (let offset = 0, column = 1, line = 1; offset < codePoints.length; ++offset, ++column) {
      const c = codePoints[offset]
      switch (c) {
        case CodePoint.BACK_SLASH:
          ++offset
          ++column
          break
        case CodePoint.LINE_FEED:
          column = 0
          ++line
          break
        case CodePoint.CLOSE_BRACKET: {
          if (codePoints[offset + 1] !== CodePoint.OPEN_PARENTHESIS) break
          const start: DataNodeTokenPoint = { offset, column, line }
          const end: DataNodeTokenPoint = { offset: offset + 2, column: column + 2, line }
          const result: DataNodeTokenPosition = { start, end }
          results.push(result)
          ++column, ++offset
          break
        }
      }
    }
    return results
  }

  /**
   * get all middle borders (pattern: /\)/)
   * @param codePoints
   * @see https://github.github.com/gfm/#link-destination
   * @see https://github.github.com/gfm/#link-title
   */
  protected matchRightFlanking(
    middleFlanking: DataNodeTokenPosition[],
    codePoints: number[],
  ): DataNodeTokenPosition[] {
    const results: DataNodeTokenPosition[] = []
    for (const middle of middleFlanking) {
      if (middle.end.offset >= codePoints.length) break
      let hasLinkDestination = false
      let hasLinkTitle = false
      const point = {
        offset: middle.end.offset,
        column: middle.end.column,
        line: middle.end.line
      }

      /**
       * match link-destination
       * @see https://github.github.com/gfm/#link-destination
       */
      const eatLinkDestination = (): boolean => {
        switch (codePoints[point.offset]) {
          /**
           * In pointy brackets:
           *  - A sequence of zero or more characters between an opening '<' and
           *    a closing '>' that contains no line breaks or unescaped '<' or '>' characters
           */
          case CodePoint.OPEN_ANGLE: {
            let inPointyBrackets = true
            for (++point.offset, ++point.column; inPointyBrackets && point.offset < codePoints.length; ++point.offset, ++point.column) {
              const c = codePoints[point.offset]
              switch (c) {
                case CodePoint.BACK_SLASH:
                  ++point.offset
                  ++point.column
                  break
                case CodePoint.OPEN_ANGLE:
                case CodePoint.LINE_FEED:
                  return false
                case CodePoint.CLOSE_ANGLE:
                  inPointyBrackets = false
                  break
              }
            }
            if (inPointyBrackets) return false
            hasLinkDestination = true
            return true
          }
          case CodePoint.CLOSE_PARENTHESIS:
            hasLinkDestination = false
            return true
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
            hasLinkDestination = true
            let inDestination = true
            let openParensCount = 1
            for (; inDestination && point.offset < codePoints.length; ++point.offset, ++point.column) {
              const c = codePoints[point.offset]
              switch (c) {
                case CodePoint.BACK_SLASH:
                  ++point.offset
                  ++point.column
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
                  --point.offset
                  --point.column
                  break
                default:
                  if (isASCIIControlCharacter(c)) return false
                  break
              }
            }
            if (inDestination || openParensCount < 0 || openParensCount > 1) return false
            return true
          }
        }
      }

      /**
       * match link-title
       * @see https://github.github.com/gfm/#link-title
       */
      const eatLinkTitle = (): boolean => {
        const _eatBlankLines = () => {
          const p = { offset: point.offset + 1, column: 1, line: point.line + 1 }
          eatBlankLines(codePoints, p)
          if (p.line > point.line + 1) return false
          point.offset = p.offset - 1
          point.line = p.line
          point.column = 0
        }
        const titleWrapSymbol: CodePoint = codePoints[point.offset]
        let inTitle = true
        switch (titleWrapSymbol) {
          /**
           *  - a sequence of zero or more characters between straight double-quote characters '"',
           *    including a '"' character only if it is backslash-escaped, or
           *  - a sequence of zero or more characters between straight single-quote characters '\'',
           *    including a '\'' character only if it is backslash-escaped,
           */
          case CodePoint.DOUBLE_QUOTE:
          case CodePoint.SINGLE_QUOTE: {
            hasLinkTitle = true
            for (++point.offset, ++point.column; inTitle && point.offset < codePoints.length; ++point.offset, ++point.column) {
              const c = codePoints[point.offset]
              switch (c) {
                case titleWrapSymbol:
                  inTitle = false
                  break
                /**
                 * Although link titles may span multiple lines, they may not contain a blank line.
                 */
                case CodePoint.LINE_FEED:
                  _eatBlankLines()
                  break
                case CodePoint.BACK_SLASH:
                  ++point.offset
                  ++point.column
                  break
                case CodePoint.LINE_FEED:
                  point.column = 0
                  ++point.line
                  break
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
            hasLinkTitle = true
            for (++point.offset, ++point.column; inTitle && point.offset < codePoints.length; ++point.offset, ++point.column) {
              const c = codePoints[point.offset]
              switch (c) {
                case CodePoint.BACK_SLASH:
                  ++point.offset
                  ++point.column
                  break
                /**
                 * Although link titles may span multiple lines, they may not contain a blank line.
                 */
                case CodePoint.LINE_FEED:
                  _eatBlankLines()
                  break
                case CodePoint.OPEN_PARENTHESIS:
                  ++openParens
                  break
                case CodePoint.CLOSE_PARENTHESIS:
                  --openParens
                  if (openParens === 0) inTitle = false
                  break
              }
            }
            break
          }
          case CodePoint.CLOSE_PARENTHESIS:
            hasLinkTitle = false
            return true
          default:
            return false
        }
        if (inTitle) return false
        return true
      }

      // optional whitespace
      eatWhiteSpaces(codePoints, point)
      if (!eatLinkDestination()) continue

      let separateSpaceCount = 0
      if (hasLinkDestination) {
        // required whitespace
        const offset = point.offset
        eatWhiteSpaces(codePoints, point)
        separateSpaceCount = point.offset - offset
      }

      if (!eatLinkTitle()) continue
      if (hasLinkDestination && hasLinkTitle && separateSpaceCount <= 0) continue
      eatWhiteSpaces(codePoints, point)

      const { offset, column, line } = point
      if (codePoints[offset] === CodePoint.CLOSE_PARENTHESIS) {
        const start: DataNodeTokenPoint = { offset, column, line }
        const end: DataNodeTokenPoint = { offset: offset + 1, column: column + 1, line }
        const result: DataNodeTokenPosition = { start, end }
        results.push(result)
      }
    }

    return results
      .sort((x, y) => x.start.offset - y.start.offset)
      .filter((v, i, self) => i === 0 || self[i - 1].start.offset !== v.start.offset)
  }
}
