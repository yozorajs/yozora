import type { YastNode } from '@yozora/ast'
import { ImageType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
} from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfFindDelimiters,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  Tokenizer,
  TokenizerMatchInlineHook,
  TokenizerParseInlineHook,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import {
  BaseTokenizer,
  TokenizerPriority,
  eatOptionalWhitespaces,
  encodeLinkDestination,
} from '@yozora/core-tokenizer'
import {
  checkBalancedBracketsStatus,
  eatLinkDestination,
  eatLinkTitle,
} from '@yozora/tokenizer-link'
import type { Delimiter, Node, T, Token, TokenizerProps } from './types'
import { uniqueName } from './types'
import { calcImageAlt } from './util'

/**
 * Lexical Analyzer for InlineImage.
 *
 * Syntax for images is like the syntax for links, with one difference.
 * Instead of link text, we have an image description.
 * The rules for this are the same as for link text, except that
 *
 *  a) an image description starts with '![' rather than '[', and
 *  b) an image description may contain links.
 *
 * An image description has inline elements as its contents. When an image is
 * rendered to HTML, this is standardly used as the image’s alt attribute.
 *
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 */
export class ImageTokenizer
  extends BaseTokenizer
  implements
    Tokenizer,
    TokenizerMatchInlineHook<T, Delimiter, Token>,
    TokenizerParseInlineHook<T, Token, Node> {
  public readonly delimiterGroup: string

  /* istanbul ignore next */
  constructor(props: TokenizerProps = {}) {
    super({
      name: props.name ?? uniqueName,
      priority: props.priority ?? TokenizerPriority.LINKS,
    })
    this.delimiterGroup = props.delimiterGroup ?? this.name
  }

  /**
   * Images can contains Images, so implement an algorithm similar to bracket
   * matching, pushing all opener delimiters onto the stack
   *
   * The rules for this are the same as for link text, except that
   *  (a) an image description starts with '![' rather than '[', and
   *  (b) an image description may contain links. An image description has
   *      inline elements as its contents. When an image is rendered to HTML,
   *      this is standardly used as the image’s alt attribute
   *
   * @see https://github.github.com/gfm/#inline-link
   * @see https://github.github.com/gfm/#example-582
   *
   * @override
   * @see TokenizerMatchInlineHook
   */
  public findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfFindDelimiters<Delimiter> {
    for (let i = startIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACKSLASH:
          i += 1
          break
        case AsciiCodePoint.EXCLAMATION_MARK: {
          if (
            i + 1 < endIndex &&
            nodePoints[i + 1].codePoint === AsciiCodePoint.OPEN_BRACKET
          ) {
            const delimiter: Delimiter = {
              type: 'opener',
              startIndex: i,
              endIndex: i + 2,
            }
            return delimiter
          }
          break
        }
        /**
         * An inline link consists of a link text followed immediately by a
         * left parenthesis '(', ..., and a right parenthesis ')'
         * @see https://github.github.com/gfm/#inline-link
         */
        case AsciiCodePoint.CLOSE_BRACKET: {
          /**
           * An inline link consists of a link text followed immediately by a
           * left parenthesis '('
           * @see https://github.github.com/gfm/#inline-link
           */
          if (
            i + 1 >= endIndex ||
            nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_PARENTHESIS
          )
            break

          // try to match link destination
          const destinationStartIndex = eatOptionalWhitespaces(
            nodePoints,
            i + 2,
            endIndex,
          )
          const destinationEndIndex = eatLinkDestination(
            nodePoints,
            destinationStartIndex,
            endIndex,
          )
          if (destinationEndIndex < 0) break

          // try to match link title
          const titleStartIndex = eatOptionalWhitespaces(
            nodePoints,
            destinationEndIndex,
            endIndex,
          )
          const titleEndIndex = eatLinkTitle(
            nodePoints,
            titleStartIndex,
            endIndex,
          )
          if (titleEndIndex < 0) break

          const _startIndex = i
          const _endIndex =
            eatOptionalWhitespaces(nodePoints, titleEndIndex, endIndex) + 1
          if (
            _endIndex > endIndex ||
            nodePoints[_endIndex - 1].codePoint !==
              AsciiCodePoint.CLOSE_PARENTHESIS
          )
            break

          /**
           * Both the title and the destination may be omitted
           * @see https://github.github.com/gfm/#example-495
           */
          const delimiter: Delimiter = {
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
          return delimiter
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
    higherPriorityInnerStates: ReadonlyArray<YastInlineToken>,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ResultOfIsDelimiterPair {
    const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
      higherPriorityInnerStates,
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
    innerTokens: YastInlineToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
    // eslint-disable-next-line no-param-reassign
    innerTokens = api.resolveFallbackTokens(
      innerTokens,
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
      nodePoints,
    )

    const token: Token = {
      nodeType: ImageType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      destinationContent: closerDelimiter.destinationContent,
      titleContent: closerDelimiter.titleContent,
      children: innerTokens,
    }
    return { token }
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

    // calc alt
    const alt = calcImageAlt(children || [])

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

    const result: Node = { type: ImageType, url, alt, title }
    return result
  }
}
