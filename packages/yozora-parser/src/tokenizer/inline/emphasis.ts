import {
  CodePoint,
  InlineDataNodeType,
  isUnicodeWhiteSpace,
  isUnicodePunctuationCharacter,
} from '@yozora/core'
import {
  DataNodeTokenPosition,
  DataNodeTokenPointDetail,
  DataNodeTokenFlanking,
} from '../../types/position'
import { DataNodeTokenizer } from '../../types/tokenizer'
import { removeIntersectPositions } from '../../util/position'
import { BaseInlineDataNodeTokenizer } from './_base'


type T = InlineDataNodeType.EMPHASIS | InlineDataNodeType.STRONG
const acceptedTypes: T[] = [InlineDataNodeType.EMPHASIS, InlineDataNodeType.STRONG]


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


/**
 * eatTo 函数的状态数据
 */
export interface EmphasisEatingState {
  /**
   * Emphasis 的边界列表
   */
  flankingList: EmphasisFlankingItem[]
}


/**
 * 匹配得到的结果
 */
export interface EmphasisMatchedResultItem extends DataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for DeleteDataNode
 */
export class EmphasisTokenizer
  extends BaseInlineDataNodeTokenizer<T, EmphasisMatchedResultItem, EmphasisEatingState>
  implements DataNodeTokenizer<T> {
  public readonly name = 'EmphasisTokenizer'
  public readonly acceptedTypes = acceptedTypes

  /**
   * override
   */
  public match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    innerAtomPositions: DataNodeTokenPosition<T>[],
    startOffset: number,
    endOffset: number,
  ): EmphasisMatchedResultItem[] {
    const result: EmphasisMatchedResultItem[] = super.match(
      content, codePoints, innerAtomPositions, startOffset, endOffset)
    return removeIntersectPositions(result)
  }

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: EmphasisEatingState,
    startOffset: number,
    endOffset: number,
    result: EmphasisMatchedResultItem[],
    precededCharacter?: CodePoint,
    followedCharacter?: CodePoint,
  ): void {
    const self = this
    for (let i = startOffset; i < endOffset; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case CodePoint.BACK_SLASH:
          ++i
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
        case CodePoint.ASTERISK:
        case CodePoint.UNDERSCORE: {
          for (++i; i < endOffset && codePoints[i].codePoint === p.codePoint;) {
            ++i
          }

          const start = p.offset, end = i
          const isLeftFlankingDelimiterRun = self.isLeftFlankingDelimiterRun(
            codePoints, start, end, startOffset, endOffset,
            start === startOffset ? precededCharacter : undefined,
            end === endOffset ? followedCharacter : undefined,
          )
          const isRightFlankingDelimiterRun = self.isRightFlankingDelimiterRun(
            codePoints, start, end, startOffset, endOffset,
            start === startOffset ? precededCharacter : undefined,
            end === endOffset ? followedCharacter : undefined,
          )

          let isLeftFlanking = isLeftFlankingDelimiterRun
          let isRightFlanking = isRightFlankingDelimiterRun
          if (p.codePoint === CodePoint.UNDERSCORE) {
            // rule #2
            if (isLeftFlankingDelimiterRun) {
              if (isRightFlankingDelimiterRun) {
                const prevCode = codePoints[start - 1].codePoint
                if (!isUnicodePunctuationCharacter(prevCode, true)) {
                  isLeftFlanking = false
                }
              }
            }

            // rule #4
            if (isRightFlankingDelimiterRun) {
              if (isLeftFlankingDelimiterRun) {
                const nextCode = codePoints[end].codePoint
                if (!isUnicodePunctuationCharacter(nextCode, true)) {
                  isRightFlanking = false
                }
              }
            }
          }

          if (!isLeftFlanking && !isRightFlanking) break
          const flanking: EmphasisFlankingItem = {
            type: isLeftFlanking ? (isRightFlanking ? 'both' : 'left') : 'right',
            start: p.offset,
            end: i,
            thickness: i - p.offset,
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
                ++thickness
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

              const resultItem: EmphasisMatchedResultItem = {
                type: thickness === 1 ? InlineDataNodeType.EMPHASIS : InlineDataNodeType.STRONG,
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
    precededCharacter?: CodePoint,
    followedCharacter?: CodePoint,
  ): boolean {
    // not followed by Unicode whitespace
    if (followedCharacter == null && end >= lastOffset) return false
    const nextCode = followedCharacter || codePoints[end].codePoint
    if (isUnicodeWhiteSpace(nextCode)) return false

    // not followed by a punctuation character
    if (!isUnicodePunctuationCharacter(nextCode, true)) return true

    // followed by a punctuation character and preceded by Unicode whitespace
    // or a punctuation character
    if (precededCharacter == null && start <= firstOffset) return true
    const prevCode = precededCharacter || codePoints[start - 1].codePoint
    if (isUnicodeWhiteSpace(prevCode) || isUnicodePunctuationCharacter(prevCode, true)) return true
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
    precededCharacter?: CodePoint,
    followedCharacter?: CodePoint,
  ): boolean {
    // not preceded by Unicode whitespace
    if (precededCharacter == null && start <= firstOffset) return false
    const prevCode = precededCharacter || codePoints[start - 1].codePoint
    if (isUnicodeWhiteSpace(prevCode)) return false

    // not preceded by a punctuation character
    if (!isUnicodePunctuationCharacter(prevCode, true)) return true

    // preceded by a punctuation character and followed by Unicode whitespace
    // or a punctuation character
    if (followedCharacter == null && end >= lastOffset) return true
    const nextCode = followedCharacter || codePoints[end].codePoint
    if (isUnicodeWhiteSpace(nextCode) || isUnicodePunctuationCharacter(nextCode, true)) return true
    return false
  }

  /**
   * override
   */
  protected initializeEatingState(state: EmphasisEatingState): void {
    state.flankingList = []
  }
}
