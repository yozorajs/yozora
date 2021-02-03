import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  Link as PS,
  LinkMatchPhaseState as MS,
  LinkTokenDelimiter as TD,
  LinkType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import {
  calcStringFromNodePointsIgnoreEscapes,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { LinkType } from './types'
import { eatLinkDestination } from './util/link-destination'
import { checkBalancedBracketsStatus } from './util/link-text'
import { eatLinkTitle } from './util/link-title'


/**
 * Params for constructing LinkTokenizer
 */
export interface LinkTokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}


/**
 * Lexical Analyzer for InlineLink
 *
 * An inline link consists of a link text followed immediately by a left
 * parenthesis '(', optional whitespace, an optional link destination, an
 * optional link title separated from the link destination by whitespace,
 * optional whitespace, and a right parenthesis ')'. The link’s text consists
 * of the inlines contained in the link text (excluding the enclosing square
 * brackets).
 * The link’s URI consists of the link destination, excluding enclosing '<...>'
 * if present, with backslash-escapes in effect as described above. The link’s
 * title consists of the link title, excluding its enclosing delimiters, with
 * backslash-escapes in effect as described above
 * @see https://github.github.com/gfm/#links
 */
export class LinkTokenizer extends BaseInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'LinkTokenizer'
  public readonly delimiterGroup: string = 'LinkTokenizer'
  public readonly recognizedTypes: T[] = [LinkType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: LinkTokenizerProps = {}) {
    super()
    if (props.delimiterPriority != null) {
      this.delimiterPriority = props.delimiterPriority
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
  }

  /**
   * An inline link consists of a link text followed immediately by a left
   * parenthesis '(', optional whitespace, an optional link destination, an
   * optional link title separated from the link destination by whitespace,
   * optional whitespace, and a right parenthesis ')'
   * @see https://github.github.com/gfm/#inline-link
   *
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
    for (let i = startIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        /**
         * A link text consists of a sequence of zero or more inline elements
         * enclosed by square brackets ([ and ])
         * @see https://github.github.com/gfm/#link-text
         */
        case AsciiCodePoint.OPEN_BRACKET: {
          const delimiter: TD = {
            type: 'opener',
            startIndex: i,
            endIndex: i + 1,
          }
          return delimiter
        }
        /**
         * An inline link consists of a link text followed immediately by a
         * left parenthesis '(', ..., and a right parenthesis ')'
         * @see https://github.github.com/gfm/#inline-link
         */
        case AsciiCodePoint.CLOSE_BRACKET: {
          if (
            i + 1 >= endIndex ||
            nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_PARENTHESIS
          ) break

          // try to match link destination
          const destinationStartIndex =
            eatOptionalWhiteSpaces(nodePoints, i + 2, endIndex)
          const destinationEndIndex =
            eatLinkDestination(nodePoints, destinationStartIndex, endIndex)
          if (destinationEndIndex < 0) break // no valid destination matched

          // try to match link title
          const titleStartIndex =
            eatOptionalWhiteSpaces(nodePoints, destinationEndIndex, endIndex)
          const titleEndIndex =
            eatLinkTitle(nodePoints, titleStartIndex, endIndex)
          if (titleEndIndex < 0) break

          const _startIndex = i
          const _endIndex = eatOptionalWhiteSpaces(nodePoints, titleEndIndex, endIndex) + 1
          if (
            _endIndex > endIndex ||
            nodePoints[_endIndex - 1].codePoint !== AsciiCodePoint.CLOSE_PARENTHESIS
          ) break

          /**
           * Both the title and the destination may be omitted
           * @see https://github.github.com/gfm/#example-495
           */
          const delimiter: TD = {
            type: 'closer',
            startIndex: _startIndex,
            endIndex: _endIndex,
            destinationContent: (destinationStartIndex < destinationEndIndex)
              ? { startIndex: destinationStartIndex, endIndex: destinationEndIndex }
              : undefined,
            titleContent: (titleStartIndex < titleEndIndex)
              ? { startIndex: titleStartIndex, endIndex: titleEndIndex }
              : undefined
          }
          return delimiter
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public isDelimiterPair(
    openerDelimiter: TD,
    closerDelimiter: TD,
    higherPriorityInnerStates: ReadonlyArray<InlineTokenizerMatchPhaseState>,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfIsDelimiterPair {
    const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
      higherPriorityInnerStates,
      nodePoints
    )
    switch (balancedBracketsStatus) {
      case -1:
        return { paired: false, opener: false, closer: true }
      case 0:
        return { paired: true }
      case 1:
        return { paired: false, opener: true, closer: false }
    }
  }

  /**
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public processDelimiterPair(
    openerDelimiter: TD,
    closerDelimiter: TD,
    innerStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): ResultOfProcessDelimiterPair<T, MS, TD> {
    const context = this.getContext()
    if (context != null) {
      // eslint-disable-next-line no-param-reassign
      innerStates = context.resolveFallbackStates(
        innerStates,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
        nodePoints,
        meta
      )
    }

    const state: MS = {
      type: LinkType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      destinationContent: closerDelimiter.destinationContent,
      titleContent: closerDelimiter.titleContent,
      children: innerStates,
    }
    return {
      state,
      shouldInactivateOlderDelimiters: true,
    }
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    matchPhaseState: MS,
    parsedChildren: YastInlineNode[] | undefined,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): PS {
    // calc url
    let url = ''
    if (matchPhaseState.destinationContent != null) {
      let { startIndex, endIndex } = matchPhaseState.destinationContent
      if (nodePoints[startIndex].codePoint === AsciiCodePoint.OPEN_ANGLE) {
        startIndex += 1
        endIndex -= 1
      }
      url = calcStringFromNodePointsIgnoreEscapes(
        nodePoints, startIndex, endIndex)
    }

    // calc title
    let title: string | undefined
    if (matchPhaseState.titleContent != null) {
      const { startIndex, endIndex } = matchPhaseState.titleContent
      title = calcStringFromNodePointsIgnoreEscapes(
        nodePoints, startIndex + 1, endIndex - 1)
    }

    const result: PS = {
      type: LinkType,
      url,
      title,
      children: parsedChildren || [],
    }
    return result
  }
}
