import { CodePoint, InlineDataNodeType, isUnicodeWhiteSpace } from '@yozora/core'
import { DataNodeTokenFlanking, DataNodeTokenPointDetail, DataNodeTokenPosition } from '../../types/position'
import { DataNodeTokenizer } from '../../types/tokenizer'
import { BaseInlineDataNodeTokenizer } from './_base'


type T = InlineDataNodeType.REFERENCE_LINK
type FlankingItem = Pick<DataNodeTokenFlanking, 'start' | 'end'>


export interface ReferenceLinkEatingState {
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
export interface ReferenceLinkMatchedResultItem extends DataNodeTokenPosition<T> {
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
 * Lexical Analyzer for ReferenceLinkDataNode
 *
 * There are three kinds of reference links:
 *  - full: A full reference link consists of a link text immediately followed by a link label
 *    that matches a link reference definition elsewhere in the document.
 *
 *    A link label begins with a left bracket '[' and ends with the first right bracket ']' that
 *    is not backslash-escaped. Between these brackets there must be at least one non-whitespace
 *    character. Unescaped square bracket characters are not allowed inside the opening and
 *    closing square brackets of link labels. A link label can have at most 999 characters
 *    inside the square brackets.
 *
 *    One label matches another just in case their normalized forms are equal. To normalize
 *    a label, strip off the opening and closing brackets, perform the Unicode case fold, strip
 *    leading and trailing whitespace and collapse consecutive internal whitespace to a single
 *    space. If there are multiple matching reference link definitions, the one that comes first
 *    in the document is used. (It is desirable in such cases to emit a warning.)
 *
 *  - collapsed: A collapsed reference link consists of a link label that matches a link
 *    reference definition elsewhere in the document, followed by the string '[]'. The contents
 *    of the first link label are parsed as inlines, which are used as the link’s text.
 *    The link’s URI and title are provided by the matching reference link definition.
 *    Thus, '[foo][]' is equivalent to '[foo][foo]'.
 *
 *  - shortcut (not support): A shortcut reference link consists of a link label that matches
 *    a link reference definition elsewhere in the document and is not followed by '[]' or a
 *    link label. The contents of the first link label are parsed as inlines, which are used
 *    as the link’s text. The link’s URI and title are provided by the matching link
 *    reference definition. Thus, '[foo]' is equivalent to '[foo][]'.
 *
 * @see https://github.github.com/gfm/#reference-link
 */
export class ReferenceLinkTokenizer
  extends BaseInlineDataNodeTokenizer<T, ReferenceLinkMatchedResultItem, ReferenceLinkEatingState>
  implements DataNodeTokenizer<T> {
  public readonly name = 'ReferenceLinkTokenizer'
  protected readonly allowInnerLinks: boolean = false

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: ReferenceLinkEatingState,
    startOffset: number,
    endOffset: number,
    result: ReferenceLinkMatchedResultItem[],
  ): void {
    const self = this

    if (!self.allowInnerLinks && precedingTokenPosition != null && precedingTokenPosition.type === InlineDataNodeType.INLINE_LINK) {
      self.initializeEatingState(state)
    }

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
         * match middle flanking (pattern: /\]\[/)
         */
        case CodePoint.CLOSE_BRACKET: {
          state.brackets.push(p)
          if (i + 1 >= endOffset || codePoints[i + 1].codePoint !== CodePoint.OPEN_BRACKET) break

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
          const textEndOffset = self.eatLinkText(
            content, codePoints, state, openBracketPoint, closeBracketPoint, startOffset)
          if (textEndOffset < 0) break

          // link-label
          const labelStartOffset = self.eatOptionalWhiteSpaces(
            content, codePoints, textEndOffset, endOffset)
          const labelEndOffset = self.eatLinkLabel(
            content, codePoints, state, labelStartOffset, endOffset)
          if (labelEndOffset < 0) break
          const hasLabel: boolean = labelEndOffset - labelStartOffset > 1

          const closeOffset = self.eatOptionalWhiteSpaces(
            content, codePoints, labelEndOffset, endOffset)
          if (closeOffset >= endOffset || codePoints[closeOffset].codePoint !== CodePoint.CLOSE_BRACKET) break

          const textFlanking: FlankingItem = {
            start: openBracketPoint.offset + 1,
            end: closeBracketPoint.offset,
          }
          const labelFlanking: FlankingItem | null = hasLabel
            ? {
              start: labelStartOffset,
              end: labelEndOffset,
            }
            : null

          i = closeOffset
          const q = codePoints[i]
          const rf = {
            start: q.offset,
            end: q.offset + 1,
            thickness: 1,
          }
          const position: ReferenceLinkMatchedResultItem = {
            type: InlineDataNodeType.REFERENCE_LINK,
            left: state.leftFlanking!,
            right: rf,
            children: [],
            textFlanking,
            labelFlanking,
          }
          result.push(position)

          /**
           * However, links may not contain other links, at any level of nesting.
           * @see https://github.github.com/gfm/#example-540
           * @see https://github.github.com/gfm/#example-541
           */
          if (!self.allowInnerLinks) self.initializeEatingState(state)
          break
        }
      }
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
   *
   * @see https://github.github.com/gfm/#link-text
   * @return position at next iteration
   */
  protected eatLinkText(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    state: ReferenceLinkEatingState,
    openBracketPoint: DataNodeTokenPointDetail,
    closeBracketPoint: DataNodeTokenPointDetail,
    startSafeOffset: number,
  ): number {
    /**
     * 将其置为左边界，即便此前已经存在左边界 (state.leftFlanking != null)；
     * 因为必然是先找到了中间边界，且尚未找到对应的右边界，说明之前的左边界和
     * 中间边界是无效的
     */
    const obp = openBracketPoint
    const cbp = closeBracketPoint
    state.leftFlanking = {
      start: obp.offset,
      end: obp.offset + 1,
      thickness: 1,
    }
    state.middleFlanking = {
      start: cbp.offset,
      end: cbp.offset + 2,
      thickness: 2,
    }
    return state.middleFlanking.end
  }

  /**
   * A link label begins with a left bracket '[' and ends with the first right bracket ']'
   * that is not backslash-escaped. Between these brackets there must be at least one
   * non-whitespace character. Unescaped square bracket characters are not allowed inside
   * the opening and closing square brackets of link labels. A link label can have at most
   * 999 characters inside the square brackets.
   *
   * One label matches another just in case their normalized forms are equal. To normalize
   * a label, strip off the opening and closing brackets, perform the Unicode case fold,
   * strip leading and trailing whitespace and collapse consecutive internal whitespace to
   * a single space. If there are multiple matching reference link definitions, the one that
   * comes first in the document is used. (It is desirable in such cases to emit a warning.)
   * @see https://github.github.com/gfm/#link-label
   * @return position at next iteration
   */
  protected eatLinkLabel(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    state: ReferenceLinkEatingState,
    startOffset: number,
    endOffset: number,
  ): number {
    let hasNonWhiteSpaceCharacter = false, c = 0
    for (let i = startOffset; i < endOffset && c < 999; ++i, ++c) {
      const p = codePoints[i]
      if (!hasNonWhiteSpaceCharacter) hasNonWhiteSpaceCharacter = !isUnicodeWhiteSpace(p.codePoint)
      switch (p.codePoint) {
        case CodePoint.BACK_SLASH:
          ++i
          break
        case CodePoint.OPEN_BRACKET:
          return -1
        case CodePoint.CLOSE_BRACKET:
          if (i === startOffset || hasNonWhiteSpaceCharacter) return i
          return -1
      }
    }
    return -1
  }

  /**
   * override
   */
  protected initializeEatingState(state: ReferenceLinkEatingState): void {
    state.brackets = []
    state.leftFlanking = null
    state.middleFlanking = null
  }
}
