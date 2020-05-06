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
  calcStringFromCodePointsIgnoreEscapes,
  eatLinkDestination,
  eatLinkTitle,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizer-core'
import {
  LinkDataNodeData,
  LinkDataNodeType,
  ReferenceLinkDataNodeType,
} from './types'
import { eatLinkText } from './util'


type T = LinkDataNodeType
type FlankingItem = Pick<DataNodeTokenFlanking, 'start' | 'end'>


export interface LinkDataNodeMatchState extends InlineDataNodeMatchState {
  /**
   * 方括号位置信息
   */
  bracketIndexes: number[]
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
}


export interface LinkDataNodeMatchedResult extends InlineDataNodeMatchResult<T> {
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
export class LinkTokenizer
  extends BaseInlineDataNodeTokenizer<
    T,
    LinkDataNodeData,
    LinkDataNodeMatchState,
    LinkDataNodeMatchedResult>
  implements InlineDataNodeTokenizer<
    T,
    LinkDataNodeData,
    LinkDataNodeMatchedResult> {

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
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: LinkDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: LinkDataNodeMatchedResult[],
  ): void {
    if (startIndex >= endIndex) return
    const self = this
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
         * match middle flanking (pattern: /\]\(/)
         */
        case AsciiCodePoint.CLOSE_BRACKET: {
          state.bracketIndexes.push(i)
          if (
            i + 1 >= endIndex
            || codePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_PARENTHESIS
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

          // link-text
          const closeBracketIndex = i
          const textEndIndex = eatLinkText(
            codePoints, state, openBracketIndex, closeBracketIndex)
          if (textEndIndex < 0) break

          // link-destination
          const destinationStartIndex = eatOptionalWhiteSpaces(
            codePoints, textEndIndex + 1, endIndex)
          const destinationEndIndex = eatLinkDestination(
            codePoints, destinationStartIndex, endIndex)
          if (destinationEndIndex < 0) break
          const hasDestination: boolean = destinationEndIndex - destinationStartIndex > 0

          // link-title
          const titleStartIndex = eatOptionalWhiteSpaces(
            codePoints, destinationEndIndex, endIndex)
          const titleEndIndex = eatLinkTitle(
            codePoints, titleStartIndex, endIndex)
          if (titleEndIndex < 0) break
          const hasTitle: boolean = titleEndIndex - titleStartIndex > 1

          const closeIndex = eatOptionalWhiteSpaces(
            codePoints, titleEndIndex, endIndex)
          if (
            closeIndex >= endIndex
            || codePoints[closeIndex].codePoint !== AsciiCodePoint.CLOSE_PARENTHESIS
          ) break

          const textFlanking: FlankingItem = {
            start: openBracketIndex + 1,
            end: closeBracketIndex,
          }
          const destinationFlanking: FlankingItem | null = hasDestination
            ? {
              start: destinationStartIndex,
              end: destinationEndIndex,
            }
            : null
          const titleFlanking: FlankingItem | null = hasTitle
            ? {
              start: titleStartIndex,
              end: titleEndIndex,
            }
            : null

          i = closeIndex
          const rf = {
            start: closeIndex,
            end: closeIndex + 1,
            thickness: 1,
          }
          const position: LinkDataNodeMatchedResult = {
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
          self.initializeMatchState(state)
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
    matchResult: LinkDataNodeMatchedResult,
    children: InlineDataNode[]
  ): LinkDataNodeData {
    const result: LinkDataNodeData = {
      url: '',
      title: undefined,   // placeholder
      children,
    }

    // calc url
    if (matchResult.destinationFlanking != null) {
      let { start, end } = matchResult.destinationFlanking
      if (codePoints[start].codePoint === AsciiCodePoint.OPEN_ANGLE) {
        ++start
        --end
      }
      result.url = calcStringFromCodePointsIgnoreEscapes(codePoints, start, end)
    }

    // calc title
    if (matchResult.titleFlanking != null) {
      const { start, end } = matchResult.titleFlanking
      result.title = calcStringFromCodePointsIgnoreEscapes(codePoints, start + 1, end - 1)
    }

    return result
  }

  /**
   * override
   */
  protected initializeMatchState(state: LinkDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.bracketIndexes = []

    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null
  }
}
