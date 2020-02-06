import {
  CodePoint,
  InlineDataNodeType,
  DataNodeTokenPoint,
  DataNodeTokenPosition,
  DataNodeTokenFlankingGraph,
  eatWhiteSpaces,
  buildGraphFromThreeFlanking,
  DataNodeTokenFlankingAssemblyGraphEdge,
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

  public match(content: string, codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    self.initBeforeMatch(content, codePoints)

    const leftFlanking = self.matchLeftFlanking()
    const middleFlanking = self.matchMiddleFlanking()
    const rightFlanking = self.matchRightFlanking(middleFlanking)
    const isMatched = self.isMatched.bind(self)
    const result = buildGraphFromThreeFlanking(
      self.type, leftFlanking, middleFlanking, rightFlanking, isMatched)
    return result
  }

  public checkCandidatePartialMatches(
    content: string,
    codePoints: number[],
    points: DataNodeTokenPoint[],
    matches: DataNodeTokenFlankingAssemblyGraphEdge<T>,
    innerMatches?: DataNodeTokenFlankingAssemblyGraphEdge<T>[],
  ): boolean {
    const middles = []
    for (let offset = matches.from; offset < matches.to; ++offset) {
      const c = codePoints[offset]
      switch (c) {
        case CodePoint.BACK_SLASH:
          ++offset
          break
        case CodePoint.CLOSE_BRACKET: {
          if (codePoints[offset + 1] !== CodePoint.OPEN_BRACKET) break
          const from: number = offset
          const to: number = offset + 2
          middles.push({ from, to, alive: true })
          ++offset
          break
        }
      }
    }

    // 如果没有内含的内联数据区间，则 ReferenceLink 的中间边界有且仅有一个
    if (innerMatches == null || innerMatches.length <= 0) return middles.length === 1

    // 否则，杀死所有被内含的内联数据区间相交或包含的 ReferenceLink 中间边界；
    let i = 0, aliveCount = 0
    for (const m of middles) {
      for (; i < innerMatches.length; ++i) {
        const im = innerMatches[i]
        if (im.to <= m.from) continue
        if (im.from >= m.to) break
        m.alive = false
        break
      }
      if (m.alive) ++aliveCount
    }

    // ReferenceLink 的中间边界有且仅有一个
    if (aliveCount !== 1) return false

    // 对于 ReferenceLink 来说，剩下的中间边界必需为最后一个
    if (!middles[middles.length-1].alive) return false

    // 且左边界不得被包含，ReferenceLink 的左边界厚度为 1
    if (innerMatches[0].from <= matches.from) return false
    return true
  }

  /**
   * get all left borders (pattern: /\[/)
   */
  protected matchLeftFlanking(): DataNodeTokenPosition[] {
    const self = this
    const { _currentCodePoints: codePoints } = self
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
   * get all middle borders (pattern: /\]\[/)
   */
  protected matchMiddleFlanking(): DataNodeTokenPosition[] {
    const self = this
    const { _currentCodePoints: codePoints } = self
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
          if (codePoints[offset + 1] !== CodePoint.OPEN_BRACKET) break
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
   */
  protected matchRightFlanking(middleFlanking: DataNodeTokenPosition[]): DataNodeTokenPosition[] {
    const self = this
    const { _currentCodePoints: codePoints } = self
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
          case CodePoint.BACK_SLASH:
            ++point.offset
            ++point.column
            break
          case CodePoint.LINE_FEED:
            point.column = 0
            ++point.line
            break
          case CodePoint.OPEN_BRACKET:
          case CodePoint.CLOSE_BRACKET:
            flag = false
            --point.offset
            --point.column
            break
        }
      }

      if (point.offset < codePoints.length && codePoints[point.offset] === CodePoint.CLOSE_BRACKET) {
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
    left: DataNodeTokenPosition,
    middle: DataNodeTokenPosition,
  ): boolean {
    if (left.end.offset >= middle.start.offset) return false
    const self = this
    const { _currentCodePoints: codePoints } = self
    const start: DataNodeTokenPoint = { ...left.end }
    eatWhiteSpaces(codePoints, start)
    if (start.offset >= middle.start.offset) return false
    return true
  }
}
