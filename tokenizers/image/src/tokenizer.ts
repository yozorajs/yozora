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
  ResultOfProcessDelimiter,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'
import type {
  Image as PS,
  ImageMatchPhaseState as MS,
  ImageTokenDelimiter as TD,
  ImageType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { checkBalancedBracketsStatus } from '@yozora/tokenizer-link'
import {
  calcStringFromNodePointsIgnoreEscapes,
  eatLinkDestination,
  eatLinkTitle,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  calcImageAlt,
} from '@yozora/tokenizercore-inline'
import { ImageType } from './types'


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
export class ImageTokenizer extends BaseInlineTokenizer implements
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'ImageTokenizer'
  public readonly recognizedTypes: T[] = [ImageType]

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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfFindDelimiters<TD> {
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
            const delimiter: TD = {
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
            eatOptionalWhiteSpaces(nodePoints, i + 2, endIndex)
          const destinationEndIndex =
            eatLinkDestination(nodePoints, destinationStartIndex, endIndex)
          if (destinationEndIndex < 0) break

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
  public processDelimiter(
    openerDelimiter: TD,
    closerDelimiter: TD,
    innerStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ): ResultOfProcessDelimiter<T, MS, TD> {
    const balancedBracketsStatus: -1 | 0 | 1 = checkBalancedBracketsStatus(
      openerDelimiter.endIndex,
      closerDelimiter.startIndex,
      innerStates,
      nodePoints
    )
    if (balancedBracketsStatus < 0) return null
    if (balancedBracketsStatus > 0) {
      return {
        state: innerStates,
        remainOpenerDelimiter: openerDelimiter,
      }
    }

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
      type: ImageType,
      startIndex: openerDelimiter.startIndex,
      endIndex: closerDelimiter.endIndex,
      destinationContent: closerDelimiter.destinationContent,
      titleContent: closerDelimiter.titleContent,
      children: innerStates,
    }
    return { state }
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

    // calc alt
    const alt = calcImageAlt(parsedChildren || [])

    // calc title
    let title: string | undefined
    if (matchPhaseState.titleContent != null) {
      const { startIndex, endIndex } = matchPhaseState.titleContent
      title = calcStringFromNodePointsIgnoreEscapes(
        nodePoints, startIndex + 1, endIndex - 1)
    }

    const result: PS = { type: ImageType, url, alt, title }
    return result
  }
}
