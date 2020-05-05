import { AsciiCodePoint } from '@yozora/character'
import {
  BaseInlineDataNodeTokenizer,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNodeMatchResult,
  InlineDataNodeMatchState,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
  calcStringFromCodePoints,
} from '@yozora/tokenizer-core'
import { InlineFormulaDataNodeData, InlineFormulaDataNodeType } from './types'


type T = InlineFormulaDataNodeType


export interface InlineFormulaDataNodeMatchState extends InlineDataNodeMatchState {
  /**
   * InlineFormula 的边界列表
   */
  leftFlankingList: DataNodeTokenFlanking[]
}


export interface InlineFormulaDataNodeMatchedResult extends InlineDataNodeMatchResult<T> {

}


/**
 * Lexical Analyzer for InlineFormulaDataNode
 */
export class InlineFormulaTokenizer
  extends BaseInlineDataNodeTokenizer<
    T,
    InlineFormulaDataNodeData,
    InlineFormulaDataNodeMatchState,
    InlineFormulaDataNodeMatchedResult>
  implements InlineDataNodeTokenizer<
    T,
    InlineFormulaDataNodeData,
    InlineFormulaDataNodeMatchedResult> {

  public readonly name = 'InlineFormulaTokenizer'
  public readonly recognizedTypes: T[] = [InlineFormulaDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: InlineFormulaDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: InlineFormulaDataNodeMatchedResult[],
  ): void {
    if (startIndex >= endIndex) return
    const self = this

    // inline-formula 内部不能存在其它类型的数据节点
    if (precedingTokenPosition != null) {
      self.initializeMatchState(state)
    }

    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          ++i
          break
        /**
         * the left flanking string pattern is: <BACKTICK STRING><DOLLAR>. eg: `$, ``$
         *
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * @see https://github.github.com/gfm/#backtick-string
         */
        case AsciiCodePoint.BACKTICK: {
          // matched as many backtick as possible
          for (++i; i < endIndex && codePoints[i].codePoint === p.codePoint;) i += 1

          // No dollar character found after backtick string
          if (i >= endIndex || codePoints[i].codePoint !== AsciiCodePoint.DOLLAR) break

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
        case AsciiCodePoint.DOLLAR: {
          // matched as many backtick as possible
          for (; i + 1 < endIndex && codePoints[i + 1].codePoint === AsciiCodePoint.BACKTICK;) i += 1

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
            const resultItem: InlineFormulaDataNodeMatchedResult = {
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
    codePoints: DataNodeTokenPointDetail[],
    matchResult: InlineFormulaDataNodeMatchedResult,
  ): InlineFormulaDataNodeData {
    const start: number = matchResult.left.end
    const end: number = matchResult.right.start
    const value: string = calcStringFromCodePoints(codePoints, start, end)
    return { value }
  }

  /**
   * override
   */
  protected initializeMatchState(state: InlineFormulaDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.leftFlankingList = []
  }
}
