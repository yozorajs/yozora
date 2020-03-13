import { CodePoint, InlineDataNodeType } from '@yozora/core'
import { DataNodeTokenFlanking, DataNodeTokenPosition, DataNodeTokenPointDetail } from '../../types/position'
import { DataNodeTokenizer, } from '../../types/tokenizer'
import { BaseInlineDataNodeTokenizer } from './_base'


type T = InlineDataNodeType.INLINE_CODE


/**
 * eatTo 函数的状态数据
 */
export interface InlineCodeEatingState {
  /**
   * InlineCode 的左边界列表
   */
  leftFlankingList: DataNodeTokenFlanking[]
}


/**
 * 匹配得到的结果
 */
export interface InlineCodeMatchedResultItem extends DataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for InlineCodeDataNode
 */
export class InlineCodeTokenizer
  extends BaseInlineDataNodeTokenizer<T, InlineCodeMatchedResultItem, InlineCodeEatingState>
  implements DataNodeTokenizer<T> {
  public readonly name = 'InlineCodeTokenizer'

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: InlineCodeEatingState,
    startOffset: number,
    endOffset: number,
    result: InlineCodeMatchedResultItem[],
  ): void {
    const self = this

    // inline-code 内部不能存在其它类型的数据节点
    if (precedingTokenPosition != null) {
      self.initializeEatingState(state)
    }

    for (let i = startOffset; i < endOffset; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case CodePoint.BACK_SLASH:
          /**
           * Note that backslash escapes do not work in code spans. All backslashes are treated literally
           * @see https://github.github.com/gfm/#example-348
           */
          if (i + 1 < endOffset && codePoints[i + 1].codePoint !== CodePoint.BACKTICK) i += 1
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
          // matched as many backtick as possible
          for (; i + 1 < endOffset && codePoints[i + 1].codePoint === p.codePoint;) i += 1

          /**
           * Note that backslash escapes do not work in code spans. All backslashes are treated literally
           * @see https://github.github.com/gfm/#example-348
           */
          const rfStart = p.offset
          const rfThickness = i - rfStart + 1
          const rf: DataNodeTokenFlanking = {
            start: rfStart,
            end: rfStart + rfThickness,
            thickness: rfThickness,
          }
          for (let leftFlankingIndex = state.leftFlankingList.length - 1; leftFlankingIndex >= 0; --leftFlankingIndex) {
            const leftFlanking = state.leftFlankingList[leftFlankingIndex]
            if (leftFlanking.thickness !== rf.thickness) continue
            const resultItem: InlineCodeMatchedResultItem = {
              type: InlineDataNodeType.INLINE_CODE,
              left: leftFlanking,
              right: rf,
              children: [],
            }
            result.push(resultItem)
            break
          }

          /**
           * backslash escapes still works in code span's left flanking
           */
          let lfStart = rf.start
          if (lfStart - 1 >= startOffset && codePoints[lfStart - 1].codePoint === CodePoint.BACKTICK) lfStart += 1
          const lfThickness = i - lfStart + 1
          if (lfThickness > 0) {
            const lf: DataNodeTokenFlanking = {
              start: lfStart,
              end: lfStart + lfThickness,
              thickness: lfThickness,
            }
            state.leftFlankingList.push(lf)
          }
          break
        }
      }
    }
  }

  /**
   * override
   */
  protected initializeEatingState(state: InlineCodeEatingState): void {
    state.leftFlankingList = []
  }
}
