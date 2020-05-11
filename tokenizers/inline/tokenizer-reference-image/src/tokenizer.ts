import { AsciiCodePoint } from '@yozora/character'
import {
  BaseInlineDataNodeTokenizer,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNode,
  InlineDataNodeMatchResult,
  InlineDataNodeMatchState,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
  eatLinkLabel,
} from '@yozora/tokenizercore'
import {
  ReferenceImageDataNodeData,
  ReferenceImageDataNodeType,
} from './types'
import { eatImageDescription } from './util'


type T = ReferenceImageDataNodeType
type FlankingItem = Pick<DataNodeTokenFlanking, 'start' | 'end'>


export interface ReferenceImageDataNodeMatchState extends InlineDataNodeMatchState {
  /**
   * 方括号位置信息
   */
  bracketIndexes: number[]
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
}


export interface ReferenceImageDataNodeMatchedResult extends InlineDataNodeMatchResult<T> {
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
export class ReferenceImageTokenizer
  extends BaseInlineDataNodeTokenizer<
    T,
    ReferenceImageDataNodeData,
    ReferenceImageDataNodeMatchState,
    ReferenceImageDataNodeMatchedResult>
  implements InlineDataNodeTokenizer<
    T,
    ReferenceImageDataNodeData,
    ReferenceImageDataNodeMatchedResult> {
  public readonly name = 'ReferenceImageTokenizer'
  public readonly recognizedTypes: T[] = [ReferenceImageDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: ReferenceImageDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: ReferenceImageDataNodeMatchedResult[],
  ): void {
    if (startIndex >= endIndex) return
    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          ++i
          break
        case AsciiCodePoint.OPEN_BRACKET: {
          state.bracketIndexes.push(i)
          break
        }
        /**
         * match middle flanking (pattern: /\]\[/)
         */
        case AsciiCodePoint.CLOSE_BRACKET: {
          state.bracketIndexes.push(i)
          if (
            i + 1 >= endIndex
            || codePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_BRACKET
          ) break

          /**
           * 往回寻找唯一的与其匹配的左中括号
           */
          let openBracketIndex: number | null = null
          for (let k = state.bracketIndexes.length - 2, openBracketCount = 0; k >= 0; --k) {
            const bracketCodePoint = codePoints[state.bracketIndexes[k]]
            if (bracketCodePoint.codePoint === AsciiCodePoint.OPEN_BRACKET) {
              ++openBracketCount
            } else if (bracketCodePoint.codePoint === AsciiCodePoint.CLOSE_BRACKET) {
              --openBracketCount
            }
            if (openBracketCount === 1) {
              openBracketIndex = state.bracketIndexes[k]
              break
            }
          }

          // 若未找到与其匹配得左中括号，则继续遍历 i
          if (openBracketIndex == null) break

          // image-description
          const closeBracketIndex = i
          const textEndIndex = eatImageDescription(
            codePoints, state, openBracketIndex, closeBracketIndex, startIndex)
          if (textEndIndex < 0) break

          // link-label
          const labelStartIndex = textEndIndex
          const labelEndIndex = eatLinkLabel(
            codePoints, labelStartIndex, endIndex)
          if (labelEndIndex < 0) break

          const rightFlankIndex = labelEndIndex - 1
          const hasLabel: boolean = labelEndIndex - labelStartIndex > 1
          const textFlanking: FlankingItem = {
            start: openBracketIndex + 1,
            end: closeBracketIndex,
          }
          const labelFlanking: FlankingItem | null = hasLabel
            ? {
              start: labelStartIndex + 1,
              end: labelEndIndex - 1,
            }
            : null

          i = rightFlankIndex
          const rf = {
            start: rightFlankIndex,
            end: rightFlankIndex + 1,
            thickness: 1,
          }
          const position: ReferenceImageDataNodeMatchedResult = {
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
    matchResult: ReferenceImageDataNodeMatchedResult,
    children?: InlineDataNode[]
  ): ReferenceImageDataNodeData {
    return {} as any
  }

  /**
   * override
   */
  protected initializeMatchState(state: ReferenceImageDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.bracketIndexes = []

    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null
  }
}
