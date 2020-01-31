import {
  CharCode,
  InlineDataNodeType,
  DataNodeTokenPoint,
  DataNodeTokenPosition,
  DataNodeTokenFlankingGraph,
  eatWhiteSpaces,
  buildGraphFromThreeFlanking,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


const T = InlineDataNodeType.REFERENCE_LINK
type T = typeof T


/**
 * Lexical Analyzer for ReferenceLinkDataNode
 *
 * There are three kinds of reference links:
 *  - full: A full reference link consists of a link text immediately followed by a link label
 *    that matches a link reference definition elsewhere in the document.
 *
 *    A link label begins with a left bracket '[' and ends with the first right bracket ']' that
 *    is not backslash-escaped. Between these brackets there must be at least one non-whitespace
 *    character. Unescaped square bracket characters are not allowed inside the opening and
 *    closing square brackets of link labels. A link label can have at most 999 characters
 *    inside the square brackets.
 *
 *    One label matches another just in case their normalized forms are equal. To normalize
 *    a label, strip off the opening and closing brackets, perform the Unicode case fold, strip
 *    leading and trailing whitespace and collapse consecutive internal whitespace to a single
 *    space. If there are multiple matching reference link definitions, the one that comes first
 *    in the document is used. (It is desirable in such cases to emit a warning.)
 *
 *  - collapsed: A collapsed reference link consists of a link label that matches a link
 *    reference definition elsewhere in the document, followed by the string []. The contents
 *    of the first link label are parsed as inlines, which are used as the link’s text.
 *    The link’s URI and title are provided by the matching reference link definition.
 *    Thus, [foo][] is equivalent to [foo][foo].
 *
 *  - shortcut (not support): A shortcut reference link consists of a link label that matches
 *    a link reference definition elsewhere in the document and is not followed by [] or a
 *    link label. The contents of the first link label are parsed as inlines, which are used
 *    as the link’s text. The link’s URI and title are provided by the matching link
 *    reference definition. Thus, [foo] is equivalent to [foo][].
 *
 * @see https://github.github.com/gfm/#reference-link
 */
export class ReferenceLinkTokenizer
  extends BaseInlineDataNodeTokenizer<T>
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  public match(codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    const leftFlanking = self.matchLeftFlanking(codePoints)
    const middleFlanking = self.matchMiddleFlanking(codePoints)
    const rightFlanking = self.matchRightFlanking(middleFlanking, codePoints)
    const isMatched = self.isMatched.bind(self, codePoints)
    const result = buildGraphFromThreeFlanking(
      self.type, leftFlanking, middleFlanking, rightFlanking, isMatched)
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
        case CharCode.BACK_SLASH:
          ++offset
          ++column
          break
        case CharCode.LINE_FEED:
          column = 0
          ++line
          break
        case CharCode.OPEN_BRACKET: {
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
   * get all middle borders (pattern: /\]\[/)
   * @param codePoints
   */
  protected matchMiddleFlanking(codePoints: number[]): DataNodeTokenPosition[] {
    const results: DataNodeTokenPosition[] = []
    for (let offset = 0, column = 1, line = 1; offset < codePoints.length; ++offset, ++column) {
      const c = codePoints[offset]
      switch (c) {
        case CharCode.BACK_SLASH:
          ++offset
          ++column
          break
        case CharCode.LINE_FEED:
          column = 0
          ++line
          break
        case CharCode.CLOSE_BRACKET: {
          if (codePoints[offset + 1] !== CharCode.OPEN_BRACKET) break
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
   * get all middle borders (pattern: /\]/)
   * @param middleFlanking
   * @param codePoints
   */
  protected matchRightFlanking(
    middleFlanking: DataNodeTokenPosition[],
    codePoints: number[],
  ): DataNodeTokenPosition[] {
    const results: DataNodeTokenPosition[] = []
    for (const middle of middleFlanking) {
      if (middle.end.offset >= codePoints.length) break
      const point = {
        offset: middle.end.offset,
        column: middle.end.column,
        line: middle.end.line,
      }

      let flag = true
      for (; flag && point.offset < codePoints.length; ++point.offset, ++point.column) {
        switch (codePoints[point.offset]) {
          case CharCode.BACK_SLASH:
            ++point.offset
            ++point.column
            break
          case CharCode.LINE_FEED:
            point.column = 0
            ++point.line
            break
          case CharCode.OPEN_BRACKET:
          case CharCode.CLOSE_BRACKET:
            flag = false
            --point.offset
            --point.column
            break
        }
      }

      if (point.offset < codePoints.length && codePoints[point.offset] === CharCode.CLOSE_BRACKET) {
        const end = {
          offset: point.offset + 1,
          column: point.column + 1,
          line: point.line,
        }
        const result: DataNodeTokenPosition = { start: point, end }
        results.push(result)
        continue
      }
    }
    return results
  }

  /**
   * A link label must contain at least one non-whitespace character
   * @see https://github.github.com/gfm/#example-559
   * @see https://github.github.com/gfm/#example-560
   */
  protected isMatched (
    codePoints: number[],
    left: DataNodeTokenPosition,
    middle: DataNodeTokenPosition,
  ): boolean {
    if (left.end.offset >= middle.start.offset) return false
    const start: DataNodeTokenPoint = { ...left.end }
    eatWhiteSpaces(codePoints, start)
    if (start.offset >= middle.start.offset) return false
    return true
  }
}
