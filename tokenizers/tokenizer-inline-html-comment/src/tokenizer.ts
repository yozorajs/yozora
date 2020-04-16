import {
  BaseInlineDataNodeTokenizer,
  CodePoint,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNodeMatchResult,
  InlineDataNodeMatchState,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
  calcStringFromCodePoints,
} from '@yozora/tokenizer-core'
import {
  InlineHtmlCommentDataNodeData,
  InlineHtmlCommentDataNodeType,
} from './types'


type T = InlineHtmlCommentDataNodeType


export interface InlineHtmlCommentDataNodeMatchState extends InlineDataNodeMatchState {
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
}


export interface InlineHtmlCommentDataNodeMatchedResult extends InlineDataNodeMatchResult<T> {

}


/**
 * Lexical Analyzer for InlineHtmlCommentDataNode
 */
export class InlineHtmlCommentTokenizer
  extends BaseInlineDataNodeTokenizer<
    T,
    InlineHtmlCommentDataNodeData,
    InlineHtmlCommentDataNodeMatchState,
    InlineHtmlCommentDataNodeMatchedResult>
  implements InlineDataNodeTokenizer<
    T,
    InlineHtmlCommentDataNodeData,
    InlineHtmlCommentDataNodeMatchedResult> {

  public readonly name = 'InlineHtmlCommentTokenizer'
  public readonly recognizedTypes: T[] = [InlineHtmlCommentDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: InlineHtmlCommentDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: InlineHtmlCommentDataNodeMatchedResult[],
  ): void {
    if (startIndex >= endIndex) return
    const self = this

    // inline-html-comment 内部不能存在其它类型的数据节点
    if (precedingTokenPosition != null) {
      self.initializeMatchState(state)
    }

    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case CodePoint.BACK_SLASH:
          ++i
          break
        // match '<!--'
        case CodePoint.OPEN_ANGLE: {
          // 如果剩下的字符数小于 3，则不足以构成左边界
          // 或已存在左边界，根据 gfm 的规范，仅需判断是否内部包含 '--' 即可令左边界失效
          if (state.leftFlanking != null || i + 3 >= endIndex) break
          if (codePoints[i + 1].codePoint !== CodePoint.EXCLAMATION_MARK) break
          if (codePoints[i + 2].codePoint !== CodePoint.HYPHEN) break
          if (codePoints[i + 3].codePoint !== CodePoint.HYPHEN) break

          // text dose not start with '>'
          if (i + 4 < endIndex && codePoints[i + 4].codePoint === CodePoint.CLOSE_ANGLE) {
            i += 4
            break
          }

          // text dose not start with '->', and does not end with -
          if (
            i + 5 < endIndex
            && codePoints[i + 4].codePoint === CodePoint.HYPHEN
            && codePoints[i + 5].codePoint === CodePoint.CLOSE_ANGLE
          ) {
            i += 5
            break
          }

          i += 3

          const thickness = 4
          // eslint-disable-next-line no-param-reassign
          state.leftFlanking = {
            start: p.offset,
            end: p.offset + thickness,
            thickness,
          }
          break
        }
        // match '-->'
        case CodePoint.HYPHEN: {
          for (++i; i < endIndex && codePoints[i].codePoint === CodePoint.HYPHEN;) i += 1

          // 如果尚未匹配到左边界或只匹配到一个 '-'，则结束此回合
          const hyphenCount = i - p.offset
          if (state.leftFlanking == null || hyphenCount < 2) break

          // text does not contain '--' and does not end with -
          if (hyphenCount > 2 || i >= endIndex || codePoints[i].codePoint !== CodePoint.CLOSE_ANGLE) {
            self.initializeMatchState(state)
            break
          }

          const q = codePoints[i]
          const rf: DataNodeTokenFlanking = {
            start: q.offset - 2,
            end: q.offset + 1,
            thickness: 3,
          }
          const resultItem: InlineHtmlCommentDataNodeMatchedResult = {
            type: InlineHtmlCommentDataNodeType,
            left: state.leftFlanking,
            right: rf,
            children: [],
          }
          result.push(resultItem)
          self.initializeMatchState(state)
          break
        }
      }
    }
  }

  /**
   * override
   */
  protected parseData(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: InlineHtmlCommentDataNodeMatchedResult,
  ): InlineHtmlCommentDataNodeData {
    const start: number = matchResult.left.end
    const end: number = matchResult.right.start
    const value: string = calcStringFromCodePoints(codePoints, start, end)
    return { value }
  }

  /**
   * override
   */
  protected initializeMatchState(state: InlineHtmlCommentDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null
  }
}
