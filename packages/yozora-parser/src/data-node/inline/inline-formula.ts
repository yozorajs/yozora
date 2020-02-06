import {
  CodePoint,
  InlineDataNodeType,
  DataNodeTokenPoint,
  DataNodeTokenPosition,
  DataNodeTokenFlankingGraph,
  buildGraphFromTwoFlanking,
  DataNodeTokenFlankingAssemblyGraphEdge,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


const T = InlineDataNodeType.INLINE_FORMULA
type T = typeof T


/**
 * Lexical Analyzer for InlineFormulaDataNode
 */
export class InlineFormulaTokenizer
  extends BaseInlineDataNodeTokenizer<T>
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  public match(content: string, codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    self.initBeforeMatch(content, codePoints)

    const leftFlanking = self.matchLeftFlanking()
    const rightFlanking = self.matchRightFlanking()
    const isMatched = self.isMatched.bind(self)
    const result = buildGraphFromTwoFlanking(self.type, leftFlanking, rightFlanking, isMatched)
    return result
  }

  public checkCandidatePartialMatches(
    content: string,
    codePoints: number[],
    points: DataNodeTokenPoint[],
    matches: DataNodeTokenFlankingAssemblyGraphEdge<T>,
    innerMatches?: DataNodeTokenFlankingAssemblyGraphEdge<T>[],
  ): boolean {
    return innerMatches == null || innerMatches.length <= 0
  }

  /**
   * get all left borders (pattern: /`+\$/)
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
         * the left flanking string pattern is: <BACKTICK STRING><DOLLAR>. eg: `$, ``$
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case CodePoint.BACKTICK: {
          const start: DataNodeTokenPoint = { offset, column, line }
          for (++offset, ++column; codePoints[offset] === c;) {
            ++column, ++offset
          }

          // No dollar character found after backtick string
          if (codePoints[offset] !== CodePoint.DOLLAR) {
            offset = start.offset
            column = start.column
            break
          }

          const end: DataNodeTokenPoint = { offset: offset + 1, column: column + 1, line }
          const position: DataNodeTokenPosition = { start, end }
          flanking.push(position)
          break
        }
      }
    }
    return flanking
  }

  /**
   * get all right borders (pattern: /\$`+/)
   */
  protected matchRightFlanking(): DataNodeTokenPosition[] {
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
         * the right flanking string pattern is: <DOLLAR><BACKTICK STRING>. eg: $`, $``
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case CodePoint.DOLLAR: {
          const start: DataNodeTokenPoint = { offset, column, line }
          for (++offset, ++column; codePoints[offset] === CodePoint.BACKTICK;) {
            ++column, ++offset
          }

          // No backtick string found after dollar character
          if (offset - start.offset === 1) {
            offset = start.offset
            column = start.column
            break
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
   * Like the code-span, A Inline-Formula begins with <BACKTICK STRING><DOLLAR>
   * and ends with <DOLLAR><BACKTICK STRING> of equal length.
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
