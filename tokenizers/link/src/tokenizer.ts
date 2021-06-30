import type { YastNode } from '@yozora/ast'
import { LinkType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
} from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import {
  BaseInlineTokenizer,
  TokenizerPriority,
  eatOptionalWhitespaces,
  encodeLinkDestination,
  isLinkToken,
} from '@yozora/core-tokenizer'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'
import { eatLinkDestination } from './util/link-destination'
import { checkBalancedBracketsStatus } from './util/link-text'
import { eatLinkTitle } from './util/link-title'

/**
 * Lexical Analyzer for InlineLink.
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
 * backslash-escapes in effect as described above.
 *
 * ------
 *
 * A 'opener' type delimiter is one of the following forms:
 *
 *  - '['
 *
 * A 'closer' type delimiter is one of the following forms:
 *
 *  - '](url)'
 *  - '](url "title")'
 *  - '](<url>)'
 *  - '](<url> "title")'
 *
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#links
 */
export class LinkTokenizer
  extends BaseInlineTokenizer<Delimiter>
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node>
{
  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.LINKS,
    })
  }

  /**
   * An inline link consists of a link text followed immediately by a left
   * parenthesis '(', optional whitespace, an optional link destination, an
   * optional link title separated from the link destination by whitespace,
   * optional whitespace, and a right parenthesis ')'
   * @see https://github.github.com/gfm/#inline-link
   *
   * @override
   * @see TokenizerMatchInlineHook
   */
  protected override _findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): Delimiter | null {
    /**
     * FIXME:
     *
     * This is a hack method to fix the situation where a higher priority token
     * is embedded in the delimiter, at this time, ignore the tokens that have
     * been parsed, and continue to match the content until the delimiter meets
     * its own definition or reaches the right boundary of the block content.
     *
     * This algorithm has not been strictly logically verified, but I think it
     * can work well in most cases. After all, it has passed many test cases.
     * @see https://github.github.com/gfm/#example-588
     */
    const blockEndIndex = api.getBlockEndIndex()

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
          const delimiter: Delimiter = {
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
          )
            break

          // try to match link destination
          const destinationStartIndex = eatOptionalWhitespaces(
            nodePoints,
            i + 2,
            blockEndIndex,
          )
          const destinationEndIndex = eatLinkDestination(
            nodePoints,
            destinationStartIndex,
            blockEndIndex,
          )
          if (destinationEndIndex < 0) break // no valid destination matched

          // try to match link title
          const titleStartIndex = eatOptionalWhitespaces(
            nodePoints,
            destinationEndIndex,
            blockEndIndex,
          )
          const titleEndIndex = eatLinkTitle(
            nodePoints,
            titleStartIndex,
            blockEndIndex,
          )
          if (titleEndIndex < 0) break

          const _startIndex = i
          const _endIndex =
            eatOptionalWhitespaces(nodePoints, titleEndIndex, blockEndIndex) + 1
          if (
            _endIndex > blockEndIndex ||
            nodePoints[_endIndex - 1].codePoint !==
              AsciiCodePoint.CLOSE_PARENTHESIS
          )
            break

          /**
           * Both the title and the destination may be omitted
           * @see https://github.github.com/gfm/#example-495
           */
          return {
            type: 'closer',
            startIndex: _startIndex,
            endIndex: _endIndex,
            destinationContent:
              destinationStartIndex < destinationEndIndex
                ? {
                    startIndex: destinationStartIndex,
                    endIndex: destinationEndIndex,
                  }
                : undefined,
            titleContent:
              titleStartIndex < titleEndIndex
                ? { startIndex: titleStartIndex, endIndex: titleEndIndex }
                : undefined,
          }
        }
      }
    }
    return null
  }

  /**
   * @override
   * @see TokenizerMatchInlineHook
   */
  public isDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    internalTokens: ReadonlyArray<YastInlineToken>,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfIsDelimiterPair {
    /**
     * Links may not contain other links, at any level of nesting.
     * @see https://github.github.com/gfm/#example-540
     * @see https://github.github.com/gfm/#example-541
     */
    const hasInternalLinkToken: boolean =
      internalTokens.find(isLinkToken) != null
    if (hasInternalLinkToken) {
      return { paired: false, opener: false, closer: false }
    }

    const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
      internalTokens,
      nodePoints,
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
   * @see TokenizerMatchInlineHook
   */
  public processDelimiterPair(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    internalTokens: YastInlineToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
    const children: YastInlineToken[] = api.resolveInternalTokens(
      internalTokens,
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
      nodePoints,
    )
    const token: Token = {
      nodeType: LinkType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      destinationContent: closerDelimiter.destinationContent,
      titleContent: closerDelimiter.titleContent,
      children,
    }
    return { tokens: [token] }
  }

  /**
   * @override
   * @see TokenizerParseInlineHook
   */
  public processToken(
    token: Token,
    children: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
  ): Node {
    // calc url
    let url = ''
    if (token.destinationContent != null) {
      let { startIndex, endIndex } = token.destinationContent
      if (nodePoints[startIndex].codePoint === AsciiCodePoint.OPEN_ANGLE) {
        startIndex += 1
        endIndex -= 1
      }
      const destination = calcEscapedStringFromNodePoints(
        nodePoints,
        startIndex,
        endIndex,
        true,
      )
      url = encodeLinkDestination(destination)
    }

    // calc title
    let title: string | undefined
    if (token.titleContent != null) {
      const { startIndex, endIndex } = token.titleContent
      title = calcEscapedStringFromNodePoints(
        nodePoints,
        startIndex + 1,
        endIndex - 1,
      )
    }

    const result: Node = {
      type: LinkType,
      url,
      title,
      children: children || [],
    }
    return result
  }
}
