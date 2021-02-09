import type { NodePoint } from '@yozora/character'
import type { YastMeta as Meta, YastNode } from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  ResultOfFindDelimiters,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  YastToken,
} from '@yozora/tokenizercore-inline'
import type {
  Image as Node,
  ImageToken as Token,
  ImageTokenDelimiter as Delimiter,
  ImageType as T,
} from './types'
import {
  AsciiCodePoint,
  calcEscapedStringFromNodePoints,
} from '@yozora/character'
import {
  checkBalancedBracketsStatus,
  eatLinkDestination,
  eatLinkTitle,
} from '@yozora/tokenizer-link'
import {
  eatOptionalWhitespaces,
  encodeLinkDestination,
} from '@yozora/tokenizercore'
import { ImageType } from './types'
import { calcImageAlt } from './util'


/**
 * Params for constructing ImageTokenizer
 */
export interface ImageTokenizerProps {
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
 * Lexical Analyzer for InlineImage
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
 * @see https://github.github.com/gfm/#images
 */
export class ImageTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, Meta, Token, Delimiter>,
  InlineTokenizerParsePhaseHook<T, Meta, Token, Node>
{
  public readonly name = 'ImageTokenizer'
  public readonly getContext: InlineTokenizer['getContext'] = () => null

  public readonly delimiterGroup: string = 'ImageTokenizer'
  public readonly recognizedTypes: T[] = [ImageType]
  public readonly delimiterPriority: number = Number.MAX_SAFE_INTEGER

  public constructor(props: ImageTokenizerProps = {}) {
    if (props.delimiterPriority != null) {
      this.delimiterPriority = props.delimiterPriority
    }
    if (props.delimiterGroup != null) {
      this.delimiterGroup = props.delimiterGroup
    }
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
   * @see InlineTokenizerMatchPhaseHook
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
          ) break

          // try to match link destination
          const destinationStartIndex =
            eatOptionalWhitespaces(nodePoints, i + 2, endIndex)
          const destinationEndIndex =
            eatLinkDestination(nodePoints, destinationStartIndex, endIndex)
          if (destinationEndIndex < 0) break

          // try to match link title
          const titleStartIndex =
            eatOptionalWhitespaces(nodePoints, destinationEndIndex, endIndex)
          const titleEndIndex =
            eatLinkTitle(nodePoints, titleStartIndex, endIndex)
          if (titleEndIndex < 0) break

          const _startIndex = i
          const _endIndex = eatOptionalWhitespaces(nodePoints, titleEndIndex, endIndex) + 1
          if (
            _endIndex > endIndex ||
            nodePoints[_endIndex - 1].codePoint !== AsciiCodePoint.CLOSE_PARENTHESIS
          ) break

          /**
           * Both the title and the destination may be omitted
           * @see https://github.github.com/gfm/#example-495
           */
          const delimiter: Delimiter = {
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
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    higherPriorityInnerStates: ReadonlyArray<YastToken>,
    nodePoints: ReadonlyArray<NodePoint>,
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
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    innerStates: YastToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter> {
    const context = this.getContext()
    if (context != null) {
      // eslint-disable-next-line no-param-reassign
      innerStates = context.resolveFallbackTokens(
        innerStates,
        openerDelimiter.endIndex,
        closerDelimiter.startIndex,
        nodePoints,
        meta
      )
    }

    const token: Token = {
      type: ImageType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      destinationContent: closerDelimiter.destinationContent,
      titleContent: closerDelimiter.titleContent,
      children: innerStates,
    }
    return { token }
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
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
        nodePoints, startIndex, endIndex, true)
      url = encodeLinkDestination(destination)
    }

    // calc alt
    const alt = calcImageAlt(children || [])

    // calc title
    let title: string | undefined
    if (token.titleContent != null) {
      const { startIndex, endIndex } = token.titleContent
      title = calcEscapedStringFromNodePoints(
        nodePoints, startIndex + 1, endIndex - 1)
    }

    const result: Node = { type: ImageType, url, alt, title }
    return result
  }
}
