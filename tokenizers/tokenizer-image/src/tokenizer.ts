import {
  InlineDataNodeTokenizer,
  BaseInlineDataNodeTokenizer,
  DataNodeTokenPointDetail,
  DataNodeTokenPosition,
  DataNodeTokenFlanking,
  DataNodeAlternative,
  DataNodeType,
  DataNode,
  CodePoint,
  eatOptionalWhiteSpaces,
  calcStringFromCodePointsIgnoreEscapes,
} from '@yozora/tokenizer-core'
import { ImageDataNodeType, ReferenceImageDataNodeType, ImageDataNodeData } from './types'
import { eatImageDescription, eatLinkDestination, eatLinkTitle } from './util'


type T = ImageDataNodeType
type FlankingItem = Pick<DataNodeTokenFlanking, 'start' | 'end'>


export interface ImageEatingState {
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


export interface ImageMatchedResultItem extends DataNodeTokenPosition<T> {
  /**
   * link-text 的边界
   */
  textFlanking: FlankingItem | null
  /**
   * link-destination 的边界
   */
  destinationFlanking: FlankingItem | null
  /**
   * link-title 的边界
   */
  titleFlanking: FlankingItem | null
}


/**
 * Lexical Analyzer for ImageDataNode
 *
 * Syntax for images is like the syntax for links, with one difference.
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
 */
export class ImageTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  ImageMatchedResultItem,
  ImageDataNodeData,
  ImageEatingState>
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'ImageTokenizer'
  public readonly recognizedTypes: T[] = [ImageDataNodeType]

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<DataNodeType> | null,
    state: ImageEatingState,
    startOffset: number,
    endOffset: number,
    result: ImageMatchedResultItem[],
  ): void {
    if (startOffset >= endOffset) return
    for (let i = startOffset; i < endOffset; ++i) {
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
         * match middle flanking (pattern: /\]\(/)
         */
        case CodePoint.CLOSE_BRACKET: {
          state.brackets.push(p)
          if (i + 1 >= endOffset || codePoints[i + 1].codePoint !== CodePoint.OPEN_PARENTHESIS) break

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

          // link-text
          const openBracketPoint = state.brackets[bracketIndex]
          const closeBracketPoint = p
          const textEndOffset = eatImageDescription(
            content, codePoints, state, openBracketPoint, closeBracketPoint, startOffset)
          if (textEndOffset < 0) break

          // link-destination
          const destinationStartOffset = eatOptionalWhiteSpaces(
            content, codePoints, textEndOffset, endOffset)
          const destinationEndOffset = eatLinkDestination(
            content, codePoints, state, destinationStartOffset, endOffset)
          if (destinationEndOffset < 0) break
          const hasDestination: boolean = destinationEndOffset - destinationStartOffset > 0

          // link-title
          const titleStartOffset = eatOptionalWhiteSpaces(
            content, codePoints, destinationEndOffset, endOffset)
          const titleEndOffset = eatLinkTitle(
            content, codePoints, state, titleStartOffset, endOffset)
          if (titleEndOffset < 0) break
          const hasTitle: boolean = titleEndOffset - titleStartOffset > 1

          const closeOffset = eatOptionalWhiteSpaces(
            content, codePoints, titleEndOffset, endOffset)
          if (closeOffset >= endOffset || codePoints[closeOffset].codePoint !== CodePoint.CLOSE_PARENTHESIS) break

          const textFlanking: FlankingItem = {
            start: openBracketPoint.offset + 1,
            end: closeBracketPoint.offset,
          }
          const destinationFlanking: FlankingItem | null = hasDestination
            ? {
              start: destinationStartOffset,
              end: destinationEndOffset,
            }
            : null
          const titleFlanking: FlankingItem | null = hasTitle
            ? {
              start: titleStartOffset,
              end: titleEndOffset,
            }
            : null

          i = closeOffset
          const q = codePoints[i]

          const rf = {
            start: q.offset,
            end: q.offset + 1,
            thickness: 1,
          }
          const position: ImageMatchedResultItem = {
            type: ImageDataNodeType,
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
            destinationFlanking,
            titleFlanking,
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
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: ImageMatchedResultItem,
    children?: DataNode[]
  ): ImageDataNodeData {
    const result: ImageDataNodeData = {
      alt: '',
      url: '',
      title: undefined,   // placeholder
    }

    // calc alt
    if (children != null && children.length > 0) {
      const calcAlt = (nodes: any[]) => {
        return nodes.map(({ type, data }: any): string => {
          if (data == null) return ''
          if (data.value != null) return data.value
          switch (type) {
            case ImageDataNodeType:
            case ReferenceImageDataNodeType:
              return (data as DataNodeAlternative).alt
          }
          if (data.children != null) return calcAlt(data.children)
          return ''
        }).join('')
      }
      result.alt = calcAlt(children)
    }

    // calc url
    if (tokenPosition.destinationFlanking != null) {
      let { start, end } = tokenPosition.destinationFlanking
      if (codePoints[start].codePoint === CodePoint.OPEN_ANGLE) {
        ++start
        --end
      }
      result.url = calcStringFromCodePointsIgnoreEscapes(codePoints, start, end)
    }

    // calc title
    if (tokenPosition.titleFlanking != null) {
      const { start, end } = tokenPosition.titleFlanking
      result.title = calcStringFromCodePointsIgnoreEscapes(codePoints, start + 1, end - 1)
    }

    return result
  }

  /**
   * override
   */
  protected initializeEatingState(state: ImageEatingState): void {
    // eslint-disable-next-line no-param-reassign
    state.brackets = []

    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null

    // eslint-disable-next-line no-param-reassign
    state.middleFlanking = null
  }
}