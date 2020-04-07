import {
  BaseInlineDataNodeTokenizer,
  CodePoint,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNodeTokenPosition,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
  calcStringFromCodePoints,
} from '@yozora/tokenizer-core'
import { InlineFormulaDataNodeData, InlineFormulaDataNodeType } from './types'


type T = InlineFormulaDataNodeType


export interface InlineFormulaEatingState {
  /**
   * InlineFormula 的边界列表
   */
  leftFlankingList: DataNodeTokenFlanking[]
}


export interface InlineFormulaMatchedResultItem extends InlineDataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for InlineFormulaDataNode
 */
export class InlineFormulaTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  InlineFormulaDataNodeData,
  InlineFormulaMatchedResultItem,
  InlineFormulaEatingState>
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'InlineFormulaTokenizer'
  public readonly recognizedTypes: T[] = [InlineFormulaDataNodeType]

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeTokenPosition<InlineDataNodeType> | null,
    state: InlineFormulaEatingState,
    startIndex: number,
    endIndex: number,
    result: InlineFormulaMatchedResultItem[],
  ): void {
    if (startIndex >= endIndex) return
    const self = this

    // inline-formula 内部不能存在其它类型的数据节点
    if (precedingTokenPosition != null) {
      self.initializeEatingState(state)
    }

    for (let i = startIndex; i < endIndex; ++i) {
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
          for (++i; i < endIndex && codePoints[i].codePoint === p.codePoint;) i += 1

          // No dollar character found after backtick string
          if (i >= endIndex || codePoints[i].codePoint !== CodePoint.DOLLAR) break

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
          for (; i + 1 < endIndex && codePoints[i + 1].codePoint === CodePoint.BACKTICK;) i += 1

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
              type: InlineFormulaDataNodeType,
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
    // eslint-disable-next-line no-param-reassign
    state.leftFlankingList = []
  }
}
