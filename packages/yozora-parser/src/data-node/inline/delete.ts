import {
  CharCode,
  InlineDataNodeType,
  DataNodeTokenPosition,
  DataNodeTokenPoint,
  buildGraphFromTwoFlanking,
  DataNodeTokenFlankingGraph,
} from '@yozora/core'
import { InlineDataNodeTokenizer } from '../types'
import { BaseInlineDataNodeTokenizer } from './_base'


const T = InlineDataNodeType.DELETE
type T = typeof T


/**
 * Lexical Analyzer for DeleteDataNode
 */
export class DeleteTokenizer
  extends BaseInlineDataNodeTokenizer<T>
  implements InlineDataNodeTokenizer<T> {
  public readonly type = T

  public match(codePoints: number[]): DataNodeTokenFlankingGraph<T> {
    const self = this
    const leftFlanking = self.matchLeftFlanking(codePoints)
    const rightFlanking = [...leftFlanking]
    const result = buildGraphFromTwoFlanking(self.type, leftFlanking, rightFlanking)
    return result
  }

  /**
   * get all left borders (pattern: /[~]{2}/)
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
        /**
         * Strike through text is any text wrapped in two tildes '~'
         * @see https://github.github.com/gfm/#strikethrough-extension-
         */
        case CharCode.TILDE: {
          if (offset + 1 >= codePoints.length || codePoints[offset + 1] !== c) break
          const start: DataNodeTokenPoint = { offset, column, line }
          const end: DataNodeTokenPoint = { offset: offset + 2, column: column + 2, line }
          const result: DataNodeTokenPosition = { start, end }
          results.push(result)
          ++offset, ++column
          break
        }
      }
    }
    return results
  }
}
