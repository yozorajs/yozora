import { AsciiCodePoint } from '@yozora/character'
import {
  BaseInlineDataNodeTokenizer,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNodeMatchResult,
  InlineDataNodeMatchState,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
} from '@yozora/tokenizer-core'
import { InlineCodeDataNodeData, InlineCodeDataNodeType } from './types'


type T = InlineCodeDataNodeType


export interface InlineCodeDataNodeMatchState extends InlineDataNodeMatchState {
  /**
   * InlineCode 的左边界列表
   */
  leftFlankingList: DataNodeTokenFlanking[]
}


export interface InlineCodeDataNodeMatchedResult extends InlineDataNodeMatchResult<T> {

}


/**
 * Lexical Analyzer for InlineCodeDataNode
 */
export class InlineCodeTokenizer
  extends BaseInlineDataNodeTokenizer<
    T,
    InlineCodeDataNodeData,
    InlineCodeDataNodeMatchState,
    InlineCodeDataNodeMatchedResult>
  implements InlineDataNodeTokenizer<
    T,
    InlineCodeDataNodeData,
    InlineCodeDataNodeMatchedResult> {

  public readonly name = 'InlineCodeTokenizer'
  public readonly recognizedTypes: T[] = [InlineCodeDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: InlineCodeDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: InlineCodeDataNodeMatchedResult[],
  ): void {
    if (startIndex >= endIndex) return
    const self = this

    // inline-code 内部不能存在其它类型的数据节点
    if (precedingTokenPosition != null) {
      self.initializeMatchState(state)
    }

    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          /**
           * Note that backslash escapes do not work in code spans.
           * All backslashes are treated literally
           * @see https://github.github.com/gfm/#example-348
           */
          if (i + 1 < endIndex && codePoints[i + 1].codePoint !== AsciiCodePoint.BACKTICK) i += 1
          break
        /**
         * A backtick string is a string of one or more backtick characters '`'
         * that is neither preceded nor followed by a backtick.
         * A code span begins with a backtick string and ends with a
         * backtick string of equal length.
         * @see https://github.github.com/gfm/#backtick-string
         * @see https://github.github.com/gfm/#code-span
         */
        case AsciiCodePoint.BACKTICK: {
          // matched as many backtick as possible
          for (; i + 1 < endIndex && codePoints[i + 1].codePoint === p.codePoint;) i += 1

          /**
           * Note that backslash escapes do not work in code spans.
           * All backslashes are treated literally
           * @see https://github.github.com/gfm/#example-348
           */
          const rfStart = p.offset
          const rfThickness = i - rfStart + 1
          const rf: DataNodeTokenFlanking = {
            start: rfStart,
            end: rfStart + rfThickness,
            thickness: rfThickness,
          }

          let leftFlankingIndex = state.leftFlankingList.length - 1
          for (; leftFlankingIndex >= 0; --leftFlankingIndex) {
            const leftFlanking = state.leftFlankingList[leftFlankingIndex]
            if (leftFlanking.thickness !== rf.thickness) continue
            const resultItem: InlineCodeDataNodeMatchedResult = {
              type: InlineCodeDataNodeType,
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
          if (
            lfStart - 1 >= startIndex
            && codePoints[lfStart - 1].codePoint === AsciiCodePoint.BACKTICK
          ) {
            lfStart += 1
          }
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
  protected parseData(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: InlineCodeDataNodeMatchedResult,
  ): InlineCodeDataNodeData {
    const self = this
    const start: number = matchResult.left.end
    const end: number = matchResult.right.start
    return {
      value: self.parseInlineCodeContent(codePoints, start, end)
    }
  }

  /**
   *
   * @param content
   * @param codePoints
   * @param startIndex
   * @param endIndex
   * @see https://github.github.com/gfm/#code-span
   */
  protected parseInlineCodeContent(
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
  ): string {
    /**
     * First line endings are converted to spaces
     * @see https://github.github.com/gfm/#example-345
     */
    let isAllSpace = true
    let value: string = codePoints.slice(startIndex, endIndex)
      .map(({ codePoint: c }): string => {
        switch (c) {
          case AsciiCodePoint.LINE_FEED:
          case AsciiCodePoint.CARRIAGE_RETURN:
          case AsciiCodePoint.SPACE:
            return ' '
          default:
            isAllSpace = false
            return String.fromCodePoint(c)
        }
      }).join('')

    /**
     * If the resulting string both begins and ends with a space character,
     * but doesn't consist entirely of space characters, a single space
     * character is removed from the front and back. This allows you to
     * include code that begins or endsWith backtick characters, which must
     * be separated by whitespace from theopening or closing backtick strings.
     * @see https://github.github.com/gfm/#example-340
     */
    if (!isAllSpace && startIndex + 2 < endIndex) {
      const firstCharacter = value[0]
      const lastCharacter = value[value.length - 1]
      if (firstCharacter === ' ' && lastCharacter === ' ') {
        value = value.substring(1, value.length - 1)
      }
    }
    return value
  }

  /**
   * override
   */
  protected initializeMatchState(state: InlineCodeDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.leftFlankingList = []
  }
}
