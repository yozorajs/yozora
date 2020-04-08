import {
  BaseInlineDataNodeTokenizer,
  CodePoint,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNodeMatchResult,
  InlineDataNode,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizer-core'
import { ReferenceImageDataNodeData, ReferenceImageDataNodeType } from './types'
import { eatImageDescription, eatLinkLabel } from './util'


type T = ReferenceImageDataNodeType
type FlankingItem = Pick<DataNodeTokenFlanking, 'start' | 'end'>


export interface ReferenceImageMatchState{
  /**
   * 方括号位置信息
   */
  brackets: Readonly<DataNodeTokenPointDetail>[]
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
  /**
   * 中间边界
   */
  middleFlanking: DataNodeTokenFlanking | null
}


export interface ReferenceImageMatchedResultItem extends InlineDataNodeMatchResult<T> {
  /**
   * link-text 的边界
   */
  textFlanking: FlankingItem | null
  /**
   * link-label 的边界
   */
  labelFlanking: FlankingItem | null
}


/**
 * Lexical Analyzer for ReferenceImageDataNode
 *
 * Syntax for reference-images is like the syntax for reference-links, with one difference.
 * Instead of link text, we have an image description.
 * The rules for this are the same as for link text, except that
 *
 *  a) an image description starts with '![' rather than '[', and
 *  b) an image description may contain links.
 *
 * An image description has inline elements as its contents. When an image is rendered to HTML,
 * this is standardly used as the image’s alt attribute.
 *
 * @see https://github.github.com/gfm/#images
 * @see https://github.github.com/gfm/#example-590
 * @see https://github.github.com/gfm/#example-592
 */
export class ReferenceImageTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  ReferenceImageDataNodeData,
  ReferenceImageMatchState,
  ReferenceImageMatchedResultItem>
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'ReferenceImageTokenizer'
  public readonly recognizedTypes: T[] = [ReferenceImageDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: ReferenceImageMatchState,
    startIndex: number,
    endIndex: number,
    result: ReferenceImageMatchedResultItem[],
  ): void {
    if (startIndex >= endIndex) return
    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case CodePoint.BACK_SLASH:
          ++i
          break
        case CodePoint.OPEN_BRACKET: {
          state.brackets.push(p)
          break
        }
        /**
         * match middle flanking (pattern: /\]\[/)
         */
        case CodePoint.CLOSE_BRACKET: {
          state.brackets.push(p)
          if (i + 1 >= endIndex || codePoints[i + 1].codePoint !== CodePoint.OPEN_BRACKET) break

          /**
           * 往回寻找唯一的与其匹配的左中括号
           */
          let bracketIndex = state.brackets.length - 2
          for (let openBracketCount = 0; bracketIndex >= 0; --bracketIndex) {
            if (state.brackets[bracketIndex].codePoint === CodePoint.OPEN_BRACKET) {
              ++openBracketCount
            } else if (state.brackets[bracketIndex].codePoint === CodePoint.CLOSE_BRACKET) {
              --openBracketCount
            }
            if (openBracketCount === 1) break
          }

          // 若未找到与其匹配得左中括号，则继续遍历 i
          if (bracketIndex < 0) break

          // image-description
          const openBracketPoint = state.brackets[bracketIndex]
          const closeBracketPoint = p
          const textEndIndex = eatImageDescription(
            codePoints, state, openBracketPoint, closeBracketPoint, startIndex)
          if (textEndIndex < 0) break

          // link-label
          const labelStartIndex = eatOptionalWhiteSpaces(
            codePoints, textEndIndex, endIndex)
          const labelEndIndex = eatLinkLabel(
            codePoints, state, labelStartIndex, endIndex)
          if (labelEndIndex < 0) break
          const hasLabel: boolean = labelEndIndex - labelStartIndex > 1

          const closeIndex = eatOptionalWhiteSpaces(
            codePoints, labelEndIndex, endIndex)
          if (closeIndex >= endIndex || codePoints[closeIndex].codePoint !== CodePoint.CLOSE_BRACKET) break

          const textFlanking: FlankingItem = {
            start: openBracketPoint.offset + 1,
            end: closeBracketPoint.offset,
          }
          const labelFlanking: FlankingItem | null = hasLabel
            ? {
              start: labelStartIndex,
              end: labelEndIndex,
            }
            : null

          i = closeIndex
          const q = codePoints[i]
          const rf = {
            start: q.offset,
            end: q.offset + 1,
            thickness: 1,
          }
          const position: ReferenceImageMatchedResultItem = {
            type: ReferenceImageDataNodeType,
            left: state.leftFlanking!,
            right: rf,
            children: [],
            _unExcavatedContentPieces: [
              {
                start: textFlanking.start,
                end: textFlanking.end,
              }
            ],
            textFlanking,
            labelFlanking,
          }
          result.push(position)
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
    matchResult: ReferenceImageMatchedResultItem,
    children?: InlineDataNode[]
  ): ReferenceImageDataNodeData {
    return {} as any
  }

  /**
   * override
   */
  protected initializeMatchState(state: ReferenceImageMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.brackets = []

    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null

    // eslint-disable-next-line no-param-reassign
    state.middleFlanking = null
  }
}
