import {
  CodePoint,
  InlineDataNodeType,
  InlineFormulaDataNodeData,
} from '@yozora/core'
import {
  DataNodeTokenFlanking,
  DataNodeTokenPosition,
  DataNodeTokenPointDetail,
} from '../../types/position'
import { DataNodeTokenizer } from '../../types/tokenizer'
import { calcStringFromCodePoints } from '../../util/position'
import { BaseInlineDataNodeTokenizer } from './_base'


type T = InlineDataNodeType.INLINE_FORMULA
const acceptedTypes: T[] = [InlineDataNodeType.INLINE_FORMULA]


/**
 * eatTo 函数的状态数据
 */
export interface InlineFormulaEatingState {
  /**
   * InlineFormula 的边界列表
   */
  leftFlankingList: DataNodeTokenFlanking[]
}


/**
 * 匹配得到的结果
 */
export interface InlineFormulaMatchedResultItem extends DataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for InlineFormulaDataNode
 */
export class InlineFormulaTokenizer extends BaseInlineDataNodeTokenizer<
  T, InlineFormulaMatchedResultItem,
  InlineFormulaDataNodeData, InlineFormulaEatingState>
  implements DataNodeTokenizer<T> {
  public readonly name = 'InlineFormulaTokenizer'
  public readonly acceptedTypes = acceptedTypes

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: InlineFormulaEatingState,
    startOffset: number,
    endOffset: number,
    result: InlineFormulaMatchedResultItem[],
  ): void {
    const self = this

    // inline-formula 内部不能存在其它类型的数据节点
    if (precedingTokenPosition != null) {
      self.initializeEatingState(state)
    }

    for (let i = startOffset; i < endOffset; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case CodePoint.BACK_SLASH:
          ++i
          break
        /**
         * the left flanking string pattern is: <BACKTICK STRING><DOLLAR>. eg: `$, ``$
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case CodePoint.BACKTICK: {
          // matched as many backtick as possible
          for (++i; i < endOffset && codePoints[i].codePoint === p.codePoint;) i += 1

          // No dollar character found after backtick string
          if (i >= endOffset || codePoints[i].codePoint !== CodePoint.DOLLAR) break

          const lfStart = p.offset
          const lfThickness = i - p.offset + 1
          const lf: DataNodeTokenFlanking = {
            start: lfStart,
            end: lfStart + lfThickness,
            thickness: lfThickness,
          }
          state.leftFlankingList.push(lf)
          break
        }
        /**
         * the right flanking string pattern is: <DOLLAR><BACKTICK STRING>. eg: $`, $``
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case CodePoint.DOLLAR: {
          // matched as many backtick as possible
          for (; i + 1 < endOffset && codePoints[i + 1].codePoint === CodePoint.BACKTICK;) i += 1

          const rfStart = p.offset
          const rfThickness = i - p.offset + 1
          const rf: DataNodeTokenFlanking = {
            start: rfStart,
            end: rfStart + rfThickness,
            thickness: rfThickness,
          }

          let leftFlankingIndex = state.leftFlankingList.length - 1
          for (; leftFlankingIndex >= 0; --leftFlankingIndex) {
            const leftFlanking = state.leftFlankingList[leftFlankingIndex]
            if (leftFlanking.thickness !== rf.thickness) continue
            const resultItem: InlineFormulaMatchedResultItem = {
              type: InlineDataNodeType.INLINE_FORMULA,
              left: leftFlanking,
              right: rf,
              children: [],
            }
            result.push(resultItem)
            break
          }
          break
        }
      }
    }
  }

  /**
   * override
   */
  protected parseData(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: InlineFormulaMatchedResultItem,
  ): InlineFormulaDataNodeData {
    const start: number = tokenPosition.left.end
    const end: number = tokenPosition.right.start
    const value: string = calcStringFromCodePoints(codePoints, start, end)
    return { value }
  }

  /**
   * override
   */
  protected initializeEatingState(state: InlineFormulaEatingState): void {
    state.leftFlankingList = []
  }
}
