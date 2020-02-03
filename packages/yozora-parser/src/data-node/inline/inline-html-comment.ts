import {
  CodePoint,
  InlineDataNodeType,
  DataNodeTokenPosition,
  DataNodeTokenFlankingGraph,
  buildGraphFromSingleFlanking,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


const T = InlineDataNodeType.INLINE_HTML_COMMENT
type T = typeof T


/**
 * Lexical Analyzer for RawHTMLDataNode
 */
export class InlineHTMLCommentTokenizer
  extends BaseInlineDataNodeTokenizer<T>
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  /**
   * An HTML comment consists of '<!--' + text + '-->', where text does not start with '>' or '->',
   * does not end with '-', and does not contain '--'.
   * @param content
   * @param codePoints
   */
  public match(content: string, codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    self.initBeforeMatch(content, codePoints)

    const flanking: DataNodeTokenPosition[] = []
    for (let offset = 0, line = 1, column = 1; offset < codePoints.length; ++offset, ++column) {
      const c = codePoints[offset]

      if (c === CodePoint.BACK_SLASH) {
        ++offset
        ++column
        continue
      }

      if (c === CodePoint.LINE_FEED) {
        column = 0
        ++line
        continue
      }

      if (c !== CodePoint.OPEN_ANGLE) continue
      if (offset + 6 >= codePoints.length) break

      // match '<!--'
      if (codePoints[offset+1] !== CodePoint.EXCLAMATION_MARK) continue
      if (codePoints[offset+2] !== CodePoint.HYPHEN) continue
      if (codePoints[offset+3] !== CodePoint.HYPHEN) continue

      // text dose not start with '>' or '->'
      if (codePoints[offset+4] === CodePoint.CLOSE_ANGLE) continue
      if (
        codePoints[offset + 4] === CodePoint.HYPHEN
        && codePoints[offset + 5] === CodePoint.CLOSE_ANGLE
      ) continue


      // match '-->
      const start = { offset, column, line }
      for (offset += 3, column += 3; offset < codePoints.length; ++offset, ++column) {
        const e = codePoints[offset]

        if (e === CodePoint.BACK_SLASH) {
          ++offset
          ++column
          continue
        }

        if (e === CodePoint.LINE_FEED) {
          column = 0
          ++line
          continue
        }

        if (e !== CodePoint.HYPHEN) continue
        if (offset + 2 >= codePoints.length) break
        if (codePoints[offset + 1] !== CodePoint.HYPHEN) continue

        // does not contain '--'
        if (codePoints[offset + 2] !== CodePoint.CLOSE_ANGLE) break
        const end = { offset: offset + 3, column: column + 3, line }
        const position: DataNodeTokenPosition = { start, end }
        flanking.push(position)
        offset += 2, column += 2
        break
      }
    }

    const result = buildGraphFromSingleFlanking(self.type, flanking)
    return result
  }
}
