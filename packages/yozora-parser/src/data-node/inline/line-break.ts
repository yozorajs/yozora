import {
  CodePoint,
  InlineDataNodeType,
  DataNodeTokenPoint,
  DataNodeTokenPosition,
  moveBackward,
  DataNodeTokenFlankingGraph,
  buildGraphFromSingleFlanking,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


const T = InlineDataNodeType.LINE_BREAK
type T = typeof T


/**
 * Lexical Analyzer for LineBreakDataNode
 */
export class LineBreakTokenizer
  extends BaseInlineDataNodeTokenizer<T>
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  public match(content: string, codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    self.initBeforeMatch(content, codePoints)

    const flanking: DataNodeTokenPosition[] = []
    for (let offset = 0, line = 1, column = 1; offset < codePoints.length; ++offset, ++column) {
      const c = codePoints[offset]
      switch (c) {
        case CodePoint.LINE_FEED: {
          const position = self.matchHardLineBreak(codePoints, offset, line, column)

          // 如果未匹配到合法的换行记号，将当前位置向前移动一个字符
          // If a valid newline token is not matched,
          // move the current position forward by one character
          if (position == null) {
            ++line, column = 0
            break
          }

          // 否则，将当前位置移动到匹配到的位置的右边界
          // Otherwise, move the current position to the right boundary of the matched position
          line = position.end.line
          column = position.end.column
          offset = position.end.offset
          flanking.push(position)
          break
        }
      }
    }
    const results = buildGraphFromSingleFlanking(self.type, flanking)
    return results
  }

  /**
   * (pattern: /[ ]{2,}\n|\\\n/)
   *
   * @param offset      offset of current character ('\n') position
   * @param line        line number of current character ('\n') position
   * @param column      column number of current character ('\n') position
   * @see https://github.github.com/gfm/#hard-line-break
   */
  protected matchHardLineBreak(
    codePoints: number[],
    offset: number,
    line: number,
    column: number
  ): DataNodeTokenPosition | null {
    let start: DataNodeTokenPoint | null = null
    if (offset > 0) {
      switch (codePoints[offset - 1]) {
        /**
         * - A line break (not in a code span or HTML tag) that is preceded
         *   by two or more spaces and does not occur at the end of a block
         *   is parsed as a hard line break (rendered in HTML as a <br /> tag)
         * - More than two spaces can be used
         * - Leading spaces at the beginning of the next line are ignored
         *
         * @see https://github.github.com/gfm/#example-654
         * @see https://github.github.com/gfm/#example-656
         * @see https://github.github.com/gfm/#example-657
         */
        case CodePoint.SPACE: {
          if (offset > 2 && codePoints[offset - 1] === CodePoint.SPACE && codePoints[offset - 2] === CodePoint.SPACE) {
            let x = offset - 3
            while (x >= 0 && codePoints[x] === CodePoint.SPACE) --x
            if (codePoints[x] !== CodePoint.LINE_FEED) {
              start = { offset: x + 1, column: column - (offset - x - 1), line }
            }
          }
          break
        }
        /**
         * For a more visible alternative, a backslash
         * before the line ending may be used instead of two spaces
         * @see https://github.github.com/gfm/#example-655
         */
        case CodePoint.BACK_SLASH: {
          if (offset > 1 && codePoints[offset - 2] !== CodePoint.BACK_SLASH) {
            start = { offset: offset - 1, column: column - 1, line }
          }
          break
        }
      }
    }

    // No valid LineBreak found
    if (start === null) return null

    /**
     * Leading spaces at the beginning of the next line are ignored
     * @see https://github.github.com/gfm/#example-657
     * @see https://github.github.com/gfm/#example-658
     */
    const end: DataNodeTokenPoint = { offset: offset + 1, column: 1, line: line + 1 }
    for (let ok = true; ok && end.offset < codePoints.length; ++end.offset, ++end.column) {
      switch (codePoints[end.offset]) {
        case CodePoint.SPACE:
          break
        case CodePoint.LINE_FEED:
          end.column = 0
          ++end.line
          break
        default:
          ok = false
      }
    }
    moveBackward(codePoints, end)
    return { start, end }
  }
}
