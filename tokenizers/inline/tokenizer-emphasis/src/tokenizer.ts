import {
  AsciiCodePoint,
  isPunctuationCharacter,
  isUnicodeWhiteSpaceCharacter,
} from '@yozora/character'
import {
  BaseInlineDataNodeTokenizer,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNode,
  InlineDataNodeMatchResult,
  InlineDataNodeMatchState,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
} from '@yozora/tokenizercore'
import {
  EmphasisDataNodeData,
  EmphasisDataNodeType,
  StrongEmphasisDataNodeType,
} from './types'


type T = EmphasisDataNodeType | StrongEmphasisDataNodeType


interface EmphasisFlankingItem {
  /**
   * 边界类型
   */
  type: 'left' | 'right' | 'both'
  /**
   * 起始位置偏移量（闭）
   */
  start: number
  /**
   * 结束位置偏移量（开）
   */
  end: number
  /**
   * 边界的字符数
   */
  thickness: number
  /**
   * 左侧消耗的字符数
   */
  leftConsumedThickness: number
  /**
   * 右侧消耗的字符数
   */
  rightConsumedThickness: number
}


export interface EmphasisDataNodeMatchState extends InlineDataNodeMatchState {
  /**
   * Emphasis 的边界列表
   */
  flankingList: EmphasisFlankingItem[]
}


export interface EmphasisDataNodeMatchedResult extends InlineDataNodeMatchResult<T> {

}


/**
 * Lexical Analyzer for EmphasisDataNode
 */
export class EmphasisTokenizer
  extends BaseInlineDataNodeTokenizer<
    T,
    EmphasisDataNodeData,
    EmphasisDataNodeMatchState,
    EmphasisDataNodeMatchedResult>
  implements InlineDataNodeTokenizer<
    T,
    EmphasisDataNodeData,
    EmphasisDataNodeMatchedResult> {

  public readonly name = 'EmphasisTokenizer'
  public readonly recognizedTypes: T[] = [EmphasisDataNodeType, StrongEmphasisDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: EmphasisDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: EmphasisDataNodeMatchedResult[],
    precededCharacter?: number,
    followedCharacter?: number,
  ): void {
    if (startIndex >= endIndex) return
    const self = this
    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          i += 1
          break
        /**
         * rule #1: A single <i>*</i> character can open emphasis iff (if and only if) it is part of a
         *          left-flanking delimiter run.
         * rule #2: A single <i>_</i> character can open emphasis iff it is part of a left-flanking
         *          delimiter run and either:
         *            (a) not part of a right-flanking delimiter run, or
         *            (b) part of a right-flanking delimiter run preceded by punctuation.
         * rule #3: A single <i>*</i> character can close emphasis iff it is part of a
         *          right-flanking delimiter run.
         * rule #4: A single <i>_</i> character can open emphasis iff it is part of a right-flanking
         *          delimiter run and either:
         *            (a) not part of a left-flanking delimiter run, or
         *            (b) part of a left-flanking delimiter run followed by punctuation.
         * @see https://github.github.com/gfm/#can-open-emphasis
         * @see https://github.github.com/gfm/#example-360
         * @see https://github.github.com/gfm/#example-366
         * @see https://github.github.com/gfm/#example-374
         * @see https://github.github.com/gfm/#example-380
         */
        case AsciiCodePoint.ASTERISK:
        case AsciiCodePoint.UNDERSCORE: {
          while (i + 1 < endIndex && codePoints[i + 1].codePoint === p.codePoint) {
            i += 1
          }
          const start = p.offset, end = i + 1
          const isLeftFlankingDelimiterRun = self.isLeftFlankingDelimiterRun(
            codePoints, start, end, startIndex, endIndex,
            start === startIndex ? precededCharacter : undefined,
            end === endIndex ? followedCharacter : undefined,
          )
          const isRightFlankingDelimiterRun = self.isRightFlankingDelimiterRun(
            codePoints, start, end, startIndex, endIndex,
            start === startIndex ? precededCharacter : undefined,
            end === endIndex ? followedCharacter : undefined,
          )

          let isLeftFlanking = isLeftFlankingDelimiterRun
          let isRightFlanking = isRightFlankingDelimiterRun
          if (p.codePoint === AsciiCodePoint.UNDERSCORE) {
            // rule #2
            if (isLeftFlankingDelimiterRun) {
              if (isRightFlankingDelimiterRun) {
                const prevCode = codePoints[start - 1].codePoint
                if (!isPunctuationCharacter(prevCode)) {
                  isLeftFlanking = false
                }
              }
            }

            // rule #4
            if (isRightFlankingDelimiterRun) {
              if (isLeftFlankingDelimiterRun) {
                const nextCode = codePoints[end].codePoint
                if (!isPunctuationCharacter(nextCode)) {
                  isRightFlanking = false
                }
              }
            }
          }

          if (!isLeftFlanking && !isRightFlanking) break
          const flanking: EmphasisFlankingItem = {
            type: isLeftFlanking ? (isRightFlanking ? 'both' : 'left') : 'right',
            start: p.offset,
            end,
            thickness: end - p.offset,
            leftConsumedThickness: 0,
            rightConsumedThickness: 0,
          }
          state.flankingList.push(flanking)

          if (!isRightFlanking) break

          /**
           * Rule #9:  Emphasis begins with a delimiter that can open emphasis and ends with a
           *           delimiter that can close emphasis, and that uses the same character
           *           ('_' or '*') as the opening delimiter. The opening and closing delimiters
           *           must belong to separate delimiter runs.
           *           If one of the delimiters can both open and close emphasis, then the sum of
           *           the lengths of the delimiter runs containing the opening and closing
           *           delimiters must not be a multiple of 3 unless both lengths are multiples of 3.
           * Rule #16: When there are two potential emphasis or strong emphasis spans with the
           *           same closing delimiter, the shorter one (the one that opens later) takes
           *           precedence. Thus, for example, '**foo **bar baz**' is parsed as
           *           '**foo <strong>bar baz</strong>' rather than '<strong>foo **bar baz</strong>'
           * @see https://github.github.com/gfm/#example-413
           */
          let leftFlankingIndex = state.flankingList.length - 2
          for (; leftFlankingIndex >= 0; --leftFlankingIndex) {
            const leftFlanking = state.flankingList[leftFlankingIndex]
            if (leftFlanking.type === 'right') continue
            if (codePoints[leftFlanking.start].codePoint !== p.codePoint) continue
            if (isLeftFlanking || leftFlanking.type === 'both') {
              if (
                (leftFlanking.thickness + flanking.thickness) % 3 == 0
                && leftFlanking.thickness % 3 !== 0
              ) continue
            }

            let remainThickness = leftFlanking.thickness
              - leftFlanking.leftConsumedThickness
              - leftFlanking.rightConsumedThickness
            if (remainThickness <= 0) continue

            /**
             * Rule #13: The number of nestings should be minimized. Thus, for example,
             *           an interpretation '<strong>...</strong>' is always preferred
             *           to '<em><em>...</em></em>'.
             * Rule #14: An interpretation '<em><strong>...</strong></em>' is always
             *           preferred to '<strong><em>...</em></strong>'
             */
            for (; remainThickness >= 1 && flanking.leftConsumedThickness + 1 <= flanking.thickness;) {
              let thickness = 1
              if (remainThickness >= 2 && flanking.leftConsumedThickness + 2 <= flanking.thickness) {
                thickness += 1
              }

              // left flanking start at the first unused character from right
              const leftFlankingEndOffset = leftFlanking.end - leftFlanking.rightConsumedThickness
              const lf: DataNodeTokenFlanking = {
                start: leftFlankingEndOffset - thickness,
                end: leftFlankingEndOffset,
                thickness,
              }

              // left flanking start at the first unused character from left
              const rightFlankingStartOffset = flanking.start + flanking.leftConsumedThickness
              const rf: DataNodeTokenFlanking = {
                start: rightFlankingStartOffset,
                end: rightFlankingStartOffset + thickness,
                thickness,
              }

              // update consumed thickness in left/right flanking
              remainThickness -= thickness
              leftFlanking.rightConsumedThickness += thickness
              flanking.leftConsumedThickness += thickness

              const resultItem: EmphasisDataNodeMatchedResult = {
                type: thickness === 1 ? EmphasisDataNodeType : StrongEmphasisDataNodeType,
                left: lf,
                right: rf,
                children: [],
                _unExcavatedContentPieces: [
                  {
                    start: lf.end,
                    end: rf.start,
                  }
                ],
              }
              result.push(resultItem)
            }

            if (flanking.leftConsumedThickness === flanking.thickness) break
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
    matchResult: EmphasisDataNodeMatchedResult,
    children: InlineDataNode[]
  ): EmphasisDataNodeData {
    return { children }
  }

  /**
   * Rule #9: Emphasis begins with a delimiter that can open emphasis and ends with a delimiter
   *          that can close emphasis, and that uses the same character (_ or *) as the opening
   *          delimiter. The opening and closing delimiters must belong to separate delimiter runs.
   *          If one of the delimiters can both open and close emphasis, then the sum of the
   *          lengths of the delimiter runs containing the opening and closing delimiters must not
   *          be a multiple of 3 unless both lengths are multiples of 3.
   * @see https://github.github.com/gfm/#example-413
   */
  protected isMatched(
    codePoints: DataNodeTokenPointDetail[],
    leftFlanking: EmphasisFlankingItem,
    rightFlanking: EmphasisFlankingItem,
    firstOffset: number,
    lastOffset: number,
  ): boolean {
    const self = this
    if (codePoints[leftFlanking.start] !== codePoints[rightFlanking.start]) return false
    if ((leftFlanking.thickness + rightFlanking.thickness) % 3 === 0) {
      if (leftFlanking.thickness % 3 === 0) return true
      if (
        self.isRightFlankingDelimiterRun(codePoints, leftFlanking.start, leftFlanking.end, firstOffset, lastOffset)
        || self.isLeftFlankingDelimiterRun(codePoints, rightFlanking.start, rightFlanking.end, firstOffset, lastOffset)
      ) return false
    }
    return true
  }

  /**
   * Check if it is a left delimiter
   * @see https://github.github.com/gfm/#left-flanking-delimiter-run
   */
  protected isLeftFlankingDelimiterRun(
    codePoints: DataNodeTokenPointDetail[],
    start: number,
    end: number,
    firstOffset: number,
    lastOffset: number,
    precededCharacter?: number,
    followedCharacter?: number,
  ): boolean {
    // not followed by Unicode whitespace
    if (followedCharacter == null && end >= lastOffset) return false
    const nextCode = followedCharacter || codePoints[end].codePoint
    if (isUnicodeWhiteSpaceCharacter(nextCode)) return false

    // not followed by a punctuation character
    if (!isPunctuationCharacter(nextCode)) return true

    // followed by a punctuation character and preceded by Unicode whitespace
    // or a punctuation character
    if (precededCharacter == null && start <= firstOffset) return true
    const prevCode = precededCharacter || codePoints[start - 1].codePoint
    if (isUnicodeWhiteSpaceCharacter(prevCode) || isPunctuationCharacter(prevCode)) return true
    return false
  }

  /**
   * Check if it is a right delimiter
   * @see https://github.github.com/gfm/#right-flanking-delimiter-run
   */
  protected isRightFlankingDelimiterRun(
    codePoints: DataNodeTokenPointDetail[],
    start: number,
    end: number,
    firstOffset: number,
    lastOffset: number,
    precededCharacter?: number,
    followedCharacter?: number,
  ): boolean {
    // not preceded by Unicode whitespace
    if (precededCharacter == null && start <= firstOffset) return false
    const prevCode = precededCharacter || codePoints[start - 1].codePoint
    if (isUnicodeWhiteSpaceCharacter(prevCode)) return false

    // not preceded by a punctuation character
    if (!isPunctuationCharacter(prevCode)) return true

    // preceded by a punctuation character and followed by Unicode whitespace
    // or a punctuation character
    if (followedCharacter == null && end >= lastOffset) return true
    const nextCode = followedCharacter || codePoints[end].codePoint
    if (isUnicodeWhiteSpaceCharacter(nextCode) || isPunctuationCharacter(nextCode)) return true
    return false
  }

  /**
   * override
   */
  protected initializeMatchState(state: EmphasisDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.flankingList = []
  }
}
