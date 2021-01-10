import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  InlineTokenizerProps,
  NextParamsOfEatDelimiters,
  RawContent,
} from '@yozora/tokenizercore-inline'
import type {
  Image,
  ImageMatchPhaseState,
  ImagePotentialToken,
  ImageTokenDelimiter,
  ImageType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
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
 * An image description has inline elements as its contents. When an image is rendered to HTML,
 * this is standardly used as the image’s alt attribute.
 *
 * @see https://github.github.com/gfm/#images
 */
export class ImageTokenizer extends BaseInlineTokenizer<T>
implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<
    T,
    ImageMatchPhaseState,
    ImageTokenDelimiter,
    ImagePotentialToken>,
  InlineTokenizerParsePhaseHook<
    T,
    ImageMatchPhaseState,
    Image>
{
  public readonly name = 'ImageTokenizer'
  public readonly uniqueTypes: T[] = [ImageType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   *
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
   */
  public * eatDelimiters(
    rawContent: RawContent,
  ): Iterator<void, ImageTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { nodePoints } = rawContent
    const delimiters: ImageTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      let precedingCodePosition: EnhancedYastNodePoint | null = null
      for (let i = startIndex; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          case AsciiCodePoint.OPEN_BRACKET: {
            let _startIndex = i
            if (
              precedingCodePosition != null &&
              precedingCodePosition.codePoint === AsciiCodePoint.EXCLAMATION_MARK
            ) {
              _startIndex -= 1
            }
            const openerDelimiter: ImageTokenDelimiter = {
              type: 'opener',
              startIndex: _startIndex,
              endIndex: i + 1,
              thickness: i + 1 - _startIndex,
            }
            delimiters.push(openerDelimiter)
            break
          }
          /**
           * An inline link consists of a link text followed immediately by a
           * left parenthesis '(', ..., and a right parenthesis ')'
           * @see https://github.github.com/gfm/#inline-link
           */
          case AsciiCodePoint.CLOSE_BRACKET: {
            /**
             * Find the index of latest free opener delimiter which can be paired
             * with the current potential closer delimiter
             */
            const latestFreeOpenerIndex: number = (() => {
              if (delimiters.length <= 0) return -1
              let closerCount = 0, k = delimiters.length - 1
              for (; k >= 0 && closerCount >= 0; --k) {
                switch (delimiters[k].type) {
                  case 'closer':
                    closerCount += 1
                    break
                  case 'opener':
                    closerCount -= 1
                    break
                }
              }
              return closerCount < 0 ? k + 1 : -1
            })()

            // No free opener delimiter found
            if (latestFreeOpenerIndex < 0) break

            /**
             * The link text may contain balanced brackets, but not unbalanced
             * ones, unless they are escaped.
             *
             * So no matter whether the current delimiter is a legal
             * closerDelimiter, it needs to consume a open bracket.
             * @see https://github.github.com/gfm/#example-520
             */
            const openerDelimiter = delimiters.splice(latestFreeOpenerIndex, 1)[0]

            /**
             * An image opener delimiter consists of '!['
             */
            if (openerDelimiter.thickness !== 2) break

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
            const destinationStartIndex = eatOptionalWhiteSpaces(
              nodePoints, i + 2, endIndex)
            const destinationEndIndex = eatLinkDestination(
              nodePoints, destinationStartIndex, endIndex)
            if (destinationEndIndex < 0) break

            // try to match link title
            const titleStartIndex = eatOptionalWhiteSpaces(
              nodePoints, destinationEndIndex, endIndex)
            const titleEndIndex = eatLinkTitle(
              nodePoints, titleStartIndex, endIndex)
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
            const closerDelimiter: ImageTokenDelimiter = {
              type: 'closer',
              startIndex: _startIndex,
              endIndex: _endIndex,
              thickness: _endIndex - _startIndex,
              destinationContents: (destinationStartIndex < destinationEndIndex)
                ? { startIndex: destinationStartIndex, endIndex: destinationEndIndex }
                : undefined,
              titleContents: (titleStartIndex < titleEndIndex)
                ? { startIndex: titleStartIndex, endIndex: titleEndIndex }
                : undefined
            }

            /**
             * If the current delimiter is a legal closerDelimiter, we need to
             * push the openerDelimiter that was previously removed back into the
             * delimiters with it's original position
             */
            delimiters.splice(latestFreeOpenerIndex, 0, openerDelimiter)

            /**
             * We find a legal closer delimiter of Image
             */
            delimiters.push(closerDelimiter)
            i = _endIndex - 1
            break
          }
        }

        // update precedingCodePosition (ignore escaped character)
        precedingCodePosition = p
      }
    }
    return delimiters
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: ImageTokenDelimiter[],
  ): ImagePotentialToken[] {
    const potentialTokens: ImagePotentialToken[] = []

    /**
     * Images can contains Images, so implement an algorithm similar to
     * bracket matching, pushing all opener delimiters onto the stack
     * @see https://github.github.com/gfm/#example-582
     */
    const openerDelimiterStack: ImageTokenDelimiter[] = []
    for (let i = 0; i < delimiters.length; ++i) {
      const delimiter = delimiters[i]

      if (delimiter.type === 'opener') {
        openerDelimiterStack.push(delimiter)
        continue
      }

      if (delimiter.type === 'closer') {
        if (openerDelimiterStack.length <= 0) continue
        const openerDelimiter = openerDelimiterStack.pop()!
        const closerDelimiter = delimiter

        const opener: InlineTokenDelimiter<'opener'> = {
          type: 'opener',
          startIndex: openerDelimiter.startIndex,
          endIndex: openerDelimiter.endIndex,
          thickness: openerDelimiter.thickness,
        }

        const middle: InlineTokenDelimiter<'middle'> = {
          type: 'middle',
          startIndex: closerDelimiter.startIndex,
          endIndex: closerDelimiter.startIndex + 2,
          thickness: 2,
        }

        const closer: InlineTokenDelimiter<'closer'> = {
          type: 'closer',
          startIndex: closerDelimiter.endIndex - 1,
          endIndex: closerDelimiter.endIndex,
          thickness: 1,
        }

        const potentialToken: ImagePotentialToken = {
          type: ImageType,
          startIndex: opener.startIndex,
          endIndex: closer.endIndex,
          destinationContents: closerDelimiter.destinationContents,
          titleContents: closerDelimiter.titleContents,
          openerDelimiter: opener,
          middleDelimiter: middle,
          closerDelimiter: closer,
          innerRawContents: [{
            startIndex: opener.endIndex,
            endIndex: middle.startIndex,
          }]
        }

        potentialTokens.push(potentialToken)
        continue
      }
    }
    return potentialTokens
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    potentialToken: ImagePotentialToken,
    innerStates: InlineTokenizerMatchPhaseState[],
  ): ImageMatchPhaseState | null {
    const result: ImageMatchPhaseState = {
      type: ImageType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      destinationContents: potentialToken.destinationContents,
      titleContents: potentialToken.titleContents,
      openerDelimiter: potentialToken.openerDelimiter,
      middleDelimiter: potentialToken.middleDelimiter,
      closerDelimiter: potentialToken.closerDelimiter,
      children: innerStates,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: ImageMatchPhaseState,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ): Image {
    const { nodePoints } = rawContent

    // calc url
    let url = ''
    if (matchPhaseState.destinationContents != null) {
      let { startIndex, endIndex } = matchPhaseState.destinationContents
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
    if (matchPhaseState.titleContents != null) {
      const { startIndex, endIndex } = matchPhaseState.titleContents
      title = calcStringFromNodePointsIgnoreEscapes(
        nodePoints, startIndex + 1, endIndex - 1)
    }

    const result: Image = {
      type: ImageType,
      url,
      alt,
      title,
    }
    return result
  }
}
