import {
  CodePoint,
  InlineDataNodeType,
  DataNodeTokenPoint,
  DataNodeTokenPosition,
  DataNodeTokenFlankingGraph,
  buildGraphFromTwoFlanking,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


const T = InlineDataNodeType.INLINE_CODE
type T = typeof T


/**
 * Lexical Analyzer for InlineCodeDataNode
 */
export class InlineCodeTokenizer
  extends BaseInlineDataNodeTokenizer<T>
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  public match(content: string, codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    self.initBeforeMatch(content, codePoints)

    const leftFlanking = self.matchLeftFlanking()
    const rightFlanking = [...leftFlanking]
    const isMatched = self.isMatched.bind(self)
    const result = buildGraphFromTwoFlanking(self.type, leftFlanking, rightFlanking, isMatched)
    return result
  }

  /**
   * get all left borders (pattern: /[`]+/)
   */
  protected matchLeftFlanking(): DataNodeTokenPosition[] {
    const self = this
    const { _currentCodePoints: codePoints } = self
    const flanking: DataNodeTokenPosition[] = []
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
        /**
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * A code span begins with a backtick string and ends with a
         * backtick string of equal length.
         * @see https://github.github.com/gfm/#backtick-string
         * @see https://github.github.com/gfm/#code-span
         */
        case CodePoint.BACKTICK: {
          const start: DataNodeTokenPoint = { offset, column, line }
          for (++offset, ++column; codePoints[offset] === c;) {
            ++column, ++offset
          }
          const end: DataNodeTokenPoint = { offset, column, line }
          const position: DataNodeTokenPosition = { start, end }
          flanking.push(position)
          --column, --offset
          break
        }
      }
    }
    return flanking
  }

  /**
   * A code span begins with a backtick string and ends with a backtick string of equal length.
   * and there is impossible.
   * And there cannot be a matching backtick string between a pair of matching backtick strings.
   *
   * @see https://github.github.com/gfm/#backtick-string
   * @see https://github.github.com/gfm/#code-span
   * @see https://github.github.com/gfm/#example-349
   * @see https://github.github.com/gfm/#example-350
   * @see https://github.github.com/gfm/#example-353
   */
  protected isMatched (
    left: DataNodeTokenPosition,
    right: DataNodeTokenPosition,
    matchedCountPrevious: number,
  ): boolean {
    if (matchedCountPrevious > 0) return false
    const leftLength = left.end.offset - left.start.offset
    const rightLength = right.end.offset - right.start.offset
    return leftLength === rightLength
  }
}
