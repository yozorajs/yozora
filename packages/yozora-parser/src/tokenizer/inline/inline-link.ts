import {
  CodePoint,
  InlineDataNodeType,
  DataNodeType,
  InlineLinkDataNodeData,
  DataNodePhrasingContent,
  isASCIIControlCharacter,
} from '@yozora/core'
import {
  DataNodeTokenFlanking,
  DataNodeTokenPointDetail,
  DataNodeTokenPosition,
} from '../../types/position'
import { DataNodeTokenizer } from '../../types/tokenizer'
import { eatOptionalWhiteSpaces, eatOptionalBlankLines } from '../../util/eat'
import { calcStringFromCodePointsIgnoreEscapes } from '../../util/position'
import { BaseInlineDataNodeTokenizer } from './_base'


type T = InlineDataNodeType.INLINE_LINK
type FlankingItem = Pick<DataNodeTokenFlanking, 'start' | 'end'>
const acceptedTypes: T[] = [InlineDataNodeType.INLINE_LINK]


/**
 * eatTo 函数的状态数据
 */
export interface InlineLinkEatingState {
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


/**
 * 匹配得到的结果
 */
export interface InlineLinkMatchedResultItem extends DataNodeTokenPosition<T> {
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
export class InlineLinkTokenizer extends BaseInlineDataNodeTokenizer<
  T, InlineLinkMatchedResultItem,
  InlineLinkDataNodeData, InlineLinkEatingState>
  implements DataNodeTokenizer<T> {
  public readonly name = 'InlineLinkTokenizer'
  public readonly acceptedTypes = acceptedTypes
  protected readonly _unAcceptableChildTypes: DataNodeType[] = [
    InlineDataNodeType.INLINE_LINK,
    InlineDataNodeType.REFERENCE_LINK,
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
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: InlineLinkEatingState,
    startOffset: number,
    endOffset: number,
    result: InlineLinkMatchedResultItem[],
  ): void {
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
          const position: InlineLinkMatchedResultItem = {
            type: InlineDataNodeType.INLINE_LINK,
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
   * 解析匹配到的内容
   */
  protected parseData(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: InlineLinkMatchedResultItem,
    children: DataNodePhrasingContent[],
  ): InlineLinkDataNodeData {
    const result: InlineLinkDataNodeData = {
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
  protected initializeEatingState(state: InlineLinkEatingState): void {
    // eslint-disable-next-line no-param-reassign
    state.brackets = []

    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null

    // eslint-disable-next-line no-param-reassign
    state.middleFlanking = null
  }
}


/**
 * A link text consists of a sequence of zero or more inline elements enclosed
 * by square brackets ('[' and ']'). The following rules apply:
 *  - Links may not contain other links, at any level of nesting.
 *    If multiple otherwise valid link definitions appear nested inside each other,
 *    the inner-most definition is used.
 *  - Brackets are allowed in the link text only if
 *    (a) they are backslash-escaped or
 *    (b) they appear as a matched pair of brackets, with an open bracket '[',
 *        a sequence of zero or more inlines, and a close bracket ']'.
 * @see https://github.github.com/gfm/#link-text
 * @return position at next iteration
 */
export function eatLinkText(
  content: string,
  codePoints: DataNodeTokenPointDetail[],
  state: InlineLinkEatingState,
  openBracketPoint: DataNodeTokenPointDetail,
  closeBracketPoint: DataNodeTokenPointDetail,
): number {
  /**
   * 将其置为左边界，即便此前已经存在左边界 (state.leftFlanking != null)；
   * 因为必然是先找到了中间边界，且尚未找到对应的右边界，说明之前的左边界和
   * 中间边界是无效的
   */
  const obp = openBracketPoint
  const cbp = closeBracketPoint
  // eslint-disable-next-line no-param-reassign
  state.leftFlanking = {
    start: obp.offset,
    end: obp.offset + 1,
    thickness: 1,
  }
  // eslint-disable-next-line no-param-reassign
  state.middleFlanking = {
    start: cbp.offset,
    end: cbp.offset + 2,
    thickness: 2,
  }
  return state.middleFlanking.end
}


/**
 * A link destination consists of either
 *  - a sequence of zero or more characters between an opening '<' and a closing '>'
 *    that contains no line breaks or unescaped '<' or '>' characters, or
 *  - a nonempty sequence of characters that does not start with '<', does not include
 *    ASCII space or control characters, and includes parentheses only if
 *    (a) they are backslash-escaped or
 *    (b) they are part of a balanced pair of unescaped parentheses. (Implementations
 *        may impose limits on parentheses nesting to avoid performance issues, but
 *        at least three levels of nesting should be supported.)
 * @see https://github.github.com/gfm/#link-destination
 * @return position at next iteration
 */
export function eatLinkDestination(
  content: string,
  codePoints: DataNodeTokenPointDetail[],
  state: InlineLinkEatingState,
  startOffset: number,
  endOffset: number,
): number {
  let i = startOffset
  switch (codePoints[i].codePoint) {
    /**
      * In pointy brackets:
      *  - A sequence of zero or more characters between an opening '<' and
      *    a closing '>' that contains no line breaks or unescaped '<' or '>' characters
      */
    case CodePoint.OPEN_ANGLE: {
      let inPointyBrackets = true
      for (++i; inPointyBrackets && i < endOffset; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case CodePoint.BACK_SLASH:
            ++i
            break
          case CodePoint.OPEN_ANGLE:
          case CodePoint.LINE_FEED:
            return -1
          case CodePoint.CLOSE_ANGLE:
            inPointyBrackets = false
            break
        }
      }
      if (inPointyBrackets) return -1
      return i
    }
    case CodePoint.CLOSE_PARENTHESIS:
      return i
    /**
     * Not in pointy brackets:
     *  - A nonempty sequence of characters that does not start with '<', does not include
     *    ASCII space or control characters, and includes parentheses only if
     *
     *    a) they are backslash-escaped or
     *    b) they are part of a balanced pair of unescaped parentheses. (Implementations
     *       may impose limits on parentheses nesting to avoid performance issues,
     *       but at least three levels of nesting should be supported.)
     */
    default: {
      let inDestination = true
      let openParensCount = 1
      for (; inDestination && i < endOffset; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case CodePoint.BACK_SLASH:
            ++i
            break
          case CodePoint.OPEN_PARENTHESIS:
            ++openParensCount
            break
          case CodePoint.CLOSE_PARENTHESIS:
            --openParensCount
            if (openParensCount > 0) break
          case CodePoint.TAB:
          case CodePoint.LINE_FEED:
          case CodePoint.SPACE:
            inDestination = false
            --i
            break
          default:
            if (isASCIIControlCharacter(p.codePoint)) return -1
            break
        }
      }
      if (inDestination || openParensCount < 0 || openParensCount > 1) return -1
      return i
    }
  }
}


/**
  * A link title consists of either
  * - a sequence of zero or more characters between straight double-quote characters '"',
  *   including a '"' character only if it is backslash-escaped, or
  * - a sequence of zero or more characters between straight single-quote characters '\'',
  *   including a '\'' character only if it is backslash-escaped, or
  * - a sequence of zero or more characters between matching parentheses '(...)',
  *   including a '(' or ')' character only if it is backslash-escaped.
  *
  * Although link titles may span multiple lines, they may not contain a blank line.
  */
export function eatLinkTitle(
  content: string,
  codePoints: DataNodeTokenPointDetail[],
  state: InlineLinkEatingState,
  startOffset: number,
  endOffset: number,
) {
  let i = startOffset
  const titleWrapSymbol = codePoints[i].codePoint
  switch (titleWrapSymbol) {
    /**
     *  - a sequence of zero or more characters between straight double-quote characters '"',
     *    including a '"' character only if it is backslash-escaped, or
     *  - a sequence of zero or more characters between straight single-quote characters '\'',
     *    including a '\'' character only if it is backslash-escaped,
     */
    case CodePoint.DOUBLE_QUOTE:
    case CodePoint.SINGLE_QUOTE: {
      for (++i; i < endOffset; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case CodePoint.BACK_SLASH:
            ++i
            break
          case titleWrapSymbol:
            return i + 1
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case CodePoint.LINE_FEED: {
            const j = eatOptionalBlankLines(content, codePoints, startOffset, i)
            if (codePoints[j].line > p.line + 1) return -1
            break
          }
        }
      }
      break
    }
    /**
     * a sequence of zero or more characters between matching parentheses '((...))',
     * including a '(' or ')' character only if it is backslash-escaped.
     */
    case CodePoint.OPEN_PARENTHESIS: {
      let openParens = 1
      for (++i; i < endOffset; ++i) {
        const p = codePoints[i]
        switch (p.codePoint) {
          case CodePoint.BACK_SLASH:
            ++i
            break
          /**
           * Although link titles may span multiple lines, they may not contain a blank line.
           */
          case CodePoint.LINE_FEED: {
            const j = eatOptionalBlankLines(content, codePoints, startOffset, i)
            if (codePoints[j].line > p.line + 1) return -1
            break
          }
          case CodePoint.OPEN_PARENTHESIS:
            ++openParens
            break
          case CodePoint.CLOSE_PARENTHESIS:
            --openParens
            if (openParens === 0) return i + 1
            break
        }
      }
      break
    }
    case CodePoint.CLOSE_PARENTHESIS:
      return i
    default:
      return -1
  }
  return -1
}
