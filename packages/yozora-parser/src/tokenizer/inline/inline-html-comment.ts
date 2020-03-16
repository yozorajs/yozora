import {
  CodePoint,
  InlineDataNodeType,
  InlineHTMLCommentDataNodeData,
} from '@yozora/core'
import {
  DataNodeTokenFlanking,
  DataNodeTokenPosition,
  DataNodeTokenPointDetail,
} from '../../types/position'
import { DataNodeTokenizer } from '../../types/tokenizer'
import { calcStringFromCodePoints } from '../../util/position'
import { BaseInlineDataNodeTokenizer } from './_base'


type T = InlineDataNodeType.INLINE_HTML_COMMENT
const acceptedTypes: T[] = [InlineDataNodeType.INLINE_HTML_COMMENT]


/**
 * eatTo 函数的状态数据
 */
export interface InlineHTMLCommentEatingState {
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
}


/**
 * 匹配得到的结果
 */
export interface InlineHTMLCommentMatchedResultItem extends DataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for RawHTMLDataNode
 */
export class InlineHTMLCommentTokenizer extends BaseInlineDataNodeTokenizer<
  T, InlineHTMLCommentMatchedResultItem,
  InlineHTMLCommentDataNodeData, InlineHTMLCommentEatingState>
  implements DataNodeTokenizer<T> {
  public readonly name = 'InlineHTMLCommentTokenizer'
  public readonly acceptedTypes = acceptedTypes

  /**
   * override
   *
   * An HTML comment consists of '<!--' + text + '-->', where text does not start with '>' or '->',
   * does not end with '-', and does not contain '--'.
   *
   * @see https://github.github.com/gfm/#html-comment
   * @see https://html.spec.whatwg.org/multipage/syntax.html#comments
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: InlineHTMLCommentEatingState,
    startOffset: number,
    endOffset: number,
    result: InlineHTMLCommentMatchedResultItem[],
  ): void {
    const self = this

    // inline-html-comment 内部不能存在其它类型的数据节点
    if (precedingTokenPosition != null) {
      self.initializeEatingState(state)
    }

    for (let i = startOffset; i < endOffset; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case CodePoint.BACK_SLASH:
          ++i
          break
        // match '<!--'
        case CodePoint.OPEN_ANGLE: {
          // 如果剩下的字符数小于 3，则不足以构成左边界
          // 或已存在左边界，根据 gfm 的规范，仅需判断是否内部包含 '--' 即可令左边界失效
          if (state.leftFlanking != null || i + 3 >= endOffset) break
          if (codePoints[i + 1].codePoint !== CodePoint.EXCLAMATION_MARK) break
          if (codePoints[i + 2].codePoint !== CodePoint.HYPHEN) break
          if (codePoints[i + 3].codePoint !== CodePoint.HYPHEN) break

          // text dose not start with '>'
          if (i + 4 < endOffset && codePoints[i + 4].codePoint === CodePoint.CLOSE_ANGLE) {
            i += 4
            break
          }

          // text dose not start with '->', and does not end with -
          if (
            i + 5 < endOffset
            && codePoints[i + 4].codePoint === CodePoint.HYPHEN
            && codePoints[i + 5].codePoint === CodePoint.CLOSE_ANGLE
          ) {
            i += 5
            break
          }

          i += 3

          const thickness = 4
          state.leftFlanking = {
            start: p.offset,
            end: p.offset + thickness,
            thickness,
          }
          break
        }
        // match '-->'
        case CodePoint.HYPHEN: {
          for (++i; i < endOffset && codePoints[i].codePoint === CodePoint.HYPHEN;) i += 1

          // 如果尚未匹配到左边界或只匹配到一个 '-'，则结束此回合
          const hyphenCount = i - p.offset
          if (state.leftFlanking == null || hyphenCount < 2) break

          // text does not contain '--' and does not end with -
          if (hyphenCount > 2 || i >= endOffset || codePoints[i].codePoint !== CodePoint.CLOSE_ANGLE) {
            self.initializeEatingState(state)
            break
          }

          const q = codePoints[i]
          const rf: DataNodeTokenFlanking = {
            start: q.offset - 2,
            end: q.offset + 1,
            thickness: 3,
          }
          const resultItem: InlineHTMLCommentMatchedResultItem = {
            type: InlineDataNodeType.INLINE_HTML_COMMENT,
            left: state.leftFlanking,
            right: rf,
            children: [],
          }
          result.push(resultItem)
          self.initializeEatingState(state)
          break
        }
      }
    }
  }

  /**
   * 解析匹配到的内容
   */
  protected parseData(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: InlineHTMLCommentMatchedResultItem,
  ): InlineHTMLCommentDataNodeData {
    const start: number = tokenPosition.left.end
    const end: number = tokenPosition.right.start
    const value: string = calcStringFromCodePoints(codePoints, start, end)
    return { value }
  }

  /**
   * override
   */
  protected initializeEatingState(state: InlineHTMLCommentEatingState): void {
    state.leftFlanking = null
  }
}
