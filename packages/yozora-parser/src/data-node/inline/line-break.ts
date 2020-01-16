import {
  CharCode,
  InlineDataNodeType,
  DataNodeTokenPoint,
  DataNodeTokenPosition,
  moveBackward,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


/**
 * Lexical Analyzer for LineBreakDataNode
 */
export class LineBreakTokenizer
  extends BaseInlineDataNodeTokenizer<InlineDataNodeType.LINE_BREAK>
  implements InlineDataNodeTokenizer<InlineDataNodeType.LINE_BREAK> {
  public readonly type = InlineDataNodeType.LINE_BREAK

  public match(content: string): DataNodeTokenPosition[] {
    const self = this
    const results: DataNodeTokenPosition[] = []
    for (let offset = 0, line = 1, column = 1; offset < content.length; ++offset, ++column) {
      const c = content.charCodeAt(offset)
      switch (c) {
        case CharCode.LINE_FEED: {
          const position = self.matchHardLineBreak(content, offset, line, column)

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
          results.push(position)
          break
        }
      }
    }
    return results
  }

  /**
   *
   * @param content source content
   * @param offset  offset of current character ('\n') position
   * @param line    line number of current character ('\n') position
   * @param column  column number of current character ('\n') position
   * @see https://github.github.com/gfm/#hard-line-break
   */
  protected matchHardLineBreak(
    content: string,
    offset: number,
    line: number,
    column: number
  ): DataNodeTokenPosition | null {
    const self = this
    const idx = (x: number) => content.charCodeAt(x)
    let start: DataNodeTokenPoint | null = null
    if (offset > 0) {
      switch (idx(offset - 1)) {
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
        case CharCode.SPACE: {
          if (offset > 2 && idx(offset - 1) === CharCode.SPACE && idx(offset - 2) === CharCode.SPACE) {
            let x = offset - 3
            while (x >= 0 && idx(x) === CharCode.SPACE) --x
            if (idx(x) !== CharCode.LINE_FEED) {
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
        case CharCode.BACK_SLASH: {
          if (offset > 1 && idx(offset - 2) !== CharCode.BACK_SLASH) {
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
    for (let ok = true; ok && end.offset < content.length; ++end.offset, ++end.column) {
      switch (idx(end.offset)) {
        case CharCode.SPACE:
          break
        case CharCode.LINE_FEED:
          end.column = 0
          ++end.line
          break
        default:
          ok = false
      }
    }
    moveBackward(content, end)
    return { start, end }
  }
}
