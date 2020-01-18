import {
  CharCode,
  InlineDataNodeType,
  DataNodeTokenPoint,
  DataNodeTokenPosition,
  DataNodeTokenFlankingGraph,
  buildGraphFromTwoFlanking,
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

  public match(content: string): DataNodeTokenFlankingGraph<T> {
    const self = this
    const leftFlanking = self.matchLeftFlanking(content)
    const rightFlanking = self.matchRightFlanking(content)
    const isMatched = self.isMatched.bind(this)
    const result = buildGraphFromTwoFlanking(self.type, leftFlanking, rightFlanking, isMatched)
    return result
  }

  /**
   * get all left borders (pattern: /`+\$/)
   * @param content
   */
  protected matchLeftFlanking(content: string): DataNodeTokenPosition[] {
    const flanking: DataNodeTokenPosition[] = []
    const idx = (x: number) => content.charCodeAt(x)
    for (let offset = 0, column = 1, line = 1; offset < content.length; ++offset, ++column) {
      const c = idx(offset)
      switch (c) {
        case CharCode.BACK_SLASH:
          ++offset
          ++column
          break
        case CharCode.LINE_FEED:
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
        case CharCode.BACKTICK: {
          const start: DataNodeTokenPoint = { offset, column, line }
          for (++offset, ++column; idx(offset) === c;) {
            ++column, ++offset
          }

          // No dollar character found after backtick string
          if (idx(offset) !== CharCode.DOLLAR) {
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
   * @param content
   */
  protected matchRightFlanking(content: string): DataNodeTokenPosition[] {
    const flanking: DataNodeTokenPosition[] = []
    const idx = (x: number) => content.charCodeAt(x)
    for (let offset = 0, column = 1, line = 1; offset < content.length; ++offset, ++column) {
      const c = idx(offset)
      switch (c) {
        case CharCode.BACK_SLASH:
          ++offset
          ++column
          break
        case CharCode.LINE_FEED:
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
        case CharCode.DOLLAR: {
          const start: DataNodeTokenPoint = { offset, column, line }
          for (++offset, ++column; idx(offset) === CharCode.BACKTICK;) {
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
