import {
  BaseInlineDataNodeTokenizer,
  CodePoint,
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  InlineDataNodeTokenPosition,
  InlineDataNode,
  InlineDataNodeType,
  InlineDataNodeTokenizer,
  calcStringFromCodePointsIgnoreEscapes,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizer-core'
import { LinkDataNodeType, ReferenceLinkDataNodeType, LinkDataNodeData } from './types'
import { eatLinkText, eatLinkDestination, eatLinkTitle } from './util'


type T = LinkDataNodeType
type FlankingItem = Pick<DataNodeTokenFlanking, 'start' | 'end'>


export interface LinkEatingState {
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


export interface LinkMatchedResultItem extends InlineDataNodeTokenPosition<T> {
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
 * Lexical Analyzer for InlineLinkDataNode
 *
 * An inline link consists of a link text followed immediately by a left parenthesis '(',
 * optional whitespace, an optional link destination, an optional link title separated from
 * the link destination by whitespace, optional whitespace, and a right parenthesis ')'.
 * The link’s text consists of the inlines contained in the link text (excluding the
 * enclosing square brackets).
 * The link’s URI consists of the link destination, excluding enclosing '<...>' if present,
 * with backslash-escapes in effect as described above. The link’s title consists of the
 * link title, excluding its enclosing delimiters, with backslash-escapes in effect as
 * described above
 * @see https://github.github.com/gfm/#links
 */
export class LinkTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  LinkDataNodeData,
  LinkMatchedResultItem,
  LinkEatingState>
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'LinkTokenizer'
  public readonly recognizedTypes: T[] = [LinkDataNodeType]
  protected readonly _unAcceptableChildTypes: InlineDataNodeType[] = [
    LinkDataNodeType,
    ReferenceLinkDataNodeType,
  ]

  /**
   * override
   *
   * An inline link consists of a link text followed immediately by a left parenthesis '(',
   * optional whitespace, an optional link destination, an optional link title separated from
   * the link destination by whitespace, optional whitespace, and a right parenthesis ')'.
   * The link’s text consists of the inlines contained in the link text (excluding the
   * enclosing square brackets). The link’s URI consists of the link destination, excluding
   * enclosing '<...>' if present, with backslash-escapes in effect as described above.
   * The link’s title consists of the link title, excluding its enclosing delimiters, with
   * backslash-escapes in effect as described above.
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeTokenPosition<InlineDataNodeType> | null,
    state: LinkEatingState,
    startOffset: number,
    endOffset: number,
    result: LinkMatchedResultItem[],
  ): void {
    if (startOffset >= endOffset) return
    const self = this
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
          const textEndOffset = eatLinkText(
            content, codePoints, state, openBracketPoint, closeBracketPoint)
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
          const position: LinkMatchedResultItem = {
            type: LinkDataNodeType,
            left: state.leftFlanking!,
            right: rf,
            children: [],
            _unExcavatedContentPieces: [
              {
                start: textFlanking.start,
                end: textFlanking.end,
              }
            ],
            _unAcceptableChildTypes: self._unAcceptableChildTypes,
            textFlanking,
            destinationFlanking,
            titleFlanking,
          }
          result.push(position)

          /**
           * However, links may not contain other links, at any level of nesting.
           * @see https://github.github.com/gfm/#example-526
           * @see https://github.github.com/gfm/#example-527
           * @see https://github.github.com/gfm/#example-528
           */
          self.initializeEatingState(state)
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
    tokenPosition: LinkMatchedResultItem,
    children: InlineDataNode[]
  ): LinkDataNodeData {
    const result: LinkDataNodeData = {
      url: '',
      title: undefined,   // placeholder
      children,
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
  protected initializeEatingState(state: LinkEatingState): void {
    // eslint-disable-next-line no-param-reassign
    state.brackets = []

    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null

    // eslint-disable-next-line no-param-reassign
    state.middleFlanking = null
  }
}
