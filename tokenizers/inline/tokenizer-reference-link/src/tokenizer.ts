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
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import {
  LinkDataNodeType,
  ReferenceLinkDataNodeData,
  ReferenceLinkDataNodeType,
} from './types'
import { eatLinkText } from './util'


type T = ReferenceLinkDataNodeType
type FlankingItem = Pick<DataNodeTokenFlanking, 'start' | 'end'>


export interface ReferenceLinkDataNodeMatchState extends InlineDataNodeMatchState {
  /**
   * 方括号位置信息
   */
  bracketIndexes: number[]
  /**
   * 左边界
   */
  leftFlanking: DataNodeTokenFlanking | null
}


export interface ReferenceLinkDataNodeMatchedResult extends InlineDataNodeMatchResult<T> {
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
  extends BaseInlineDataNodeTokenizer<
    T,
    ReferenceLinkDataNodeData,
    ReferenceLinkDataNodeMatchState,
    ReferenceLinkDataNodeMatchedResult>
  implements InlineDataNodeTokenizer<
    T,
    ReferenceLinkDataNodeData,
    ReferenceLinkDataNodeMatchedResult> {

  public readonly name = 'ReferenceLinkTokenizer'
  public readonly recognizedTypes: T[] = [ReferenceLinkDataNodeType]
  protected readonly _unAcceptableChildTypes: InlineDataNodeType[] = [
    LinkDataNodeType,
    ReferenceLinkDataNodeType,
  ]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: ReferenceLinkDataNodeMatchState,
    startIndex: number,
    endIndex: number,
    result: ReferenceLinkDataNodeMatchedResult[],
  ): void {
    if (startIndex >= endIndex) return
    const self = this

    if (precedingTokenPosition != null && precedingTokenPosition.type === LinkDataNodeType) {
      self.initializeMatchState(state)
    }

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

          // link-text
          const closeBracketIndex = i
          const textEndIndex = eatLinkText(
            codePoints, state, openBracketIndex, closeBracketIndex)
          if (textEndIndex < 0) break

          // link-label
          const labelStartIndex = textEndIndex
          const labelEndIndex = eatLinkLabel(
            codePoints, labelStartIndex, endIndex)
          if (labelEndIndex < 0) break
          const hasLabel: boolean = labelEndIndex - labelStartIndex > 1

          const rightFlankIndex = labelEndIndex - 1
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
          const position: ReferenceLinkDataNodeMatchedResult = {
            type: ReferenceLinkDataNodeType,
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
            labelFlanking,
          }
          result.push(position)

          /**
           * However, links may not contain other links, at any level of nesting.
           * @see https://github.github.com/gfm/#example-540
           * @see https://github.github.com/gfm/#example-541
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
    matchResult: ReferenceLinkDataNodeMatchedResult,
    children?: InlineDataNode[]
  ): ReferenceLinkDataNodeData {
    return {} as any
  }

  /**
   * override
   */
  protected initializeMatchState(state: ReferenceLinkDataNodeMatchState): void {
    // eslint-disable-next-line no-param-reassign
    state.bracketIndexes = []

    // eslint-disable-next-line no-param-reassign
    state.leftFlanking = null
  }
}
