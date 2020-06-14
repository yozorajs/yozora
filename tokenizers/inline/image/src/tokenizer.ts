import { AsciiCodePoint } from '@yozora/character'
import {
  DataNodeTokenPointDetail,
  calcStringFromCodePointsIgnoreEscapes,
  eatLinkDestination,
  eatLinkTitle,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlineTokenDelimiter,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseHook,
  InlineTokenizerPreMatchPhaseState,
  NextParamsOfEatDelimiters,
  RawContent,
  calcImageAlt,
} from '@yozora/tokenizercore-inline'
import {
  ImageDataNode,
  ImageDataNodeType,
  ImageMatchPhaseState,
  ImagePotentialToken,
  ImagePreMatchPhaseState,
  ImageTokenDelimiter,
} from './types'


type T = ImageDataNodeType


/**
 * Lexical Analyzer for InlineImageDataNode
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
  InlineTokenizerPreMatchPhaseHook<
    T,
    ImagePreMatchPhaseState,
    ImageTokenDelimiter,
    ImagePotentialToken>,
  InlineTokenizerMatchPhaseHook<
    T,
    ImagePreMatchPhaseState,
    ImageMatchPhaseState>,
  InlineTokenizerParsePhaseHook<
    T,
    ImageMatchPhaseState,
    ImageDataNode>
{
  public readonly name = 'ImageTokenizer'
  public readonly uniqueTypes: T[] = [ImageDataNodeType]

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
    const { codePositions } = rawContent
    const delimiters: ImageTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      let precedingCodePosition: DataNodeTokenPointDetail | null = null
      for (let i = startIndex; i < endIndex; ++i) {
        const p = codePositions[i]
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
              codePositions[i + 1].codePoint !== AsciiCodePoint.OPEN_PARENTHESIS
            ) break

            // try to match link destination
            const destinationStartIndex = eatOptionalWhiteSpaces(
              codePositions, i + 2, endIndex)
            const destinationEndIndex = eatLinkDestination(
              codePositions, destinationStartIndex, endIndex)
            if (destinationEndIndex < 0) break

            // try to match link title
            const titleStartIndex = eatOptionalWhiteSpaces(
              codePositions, destinationEndIndex, endIndex)
            const titleEndIndex = eatLinkTitle(
              codePositions, titleStartIndex, endIndex)
            if (titleEndIndex < 0) break

            const _startIndex = i
            const _endIndex = eatOptionalWhiteSpaces(codePositions, titleEndIndex, endIndex) + 1
            if (
              _endIndex > endIndex ||
              codePositions[_endIndex - 1].codePoint !== AsciiCodePoint.CLOSE_PARENTHESIS
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
          type: ImageDataNodeType,
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
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    rawContent: RawContent,
    potentialToken: ImagePotentialToken,
    innerState: InlineTokenizerPreMatchPhaseState[],
  ): ImagePreMatchPhaseState {
    const result: ImagePreMatchPhaseState = {
      type: ImageDataNodeType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      destinationContents: potentialToken.destinationContents,
      titleContents: potentialToken.titleContents,
      openerDelimiter: potentialToken.openerDelimiter,
      middleDelimiter: potentialToken.middleDelimiter,
      closerDelimiter: potentialToken.closerDelimiter,
      children: innerState,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    preMatchPhaseState: ImagePreMatchPhaseState,
  ): ImageMatchPhaseState | false {
    const result: ImageMatchPhaseState = {
      type: ImageDataNodeType,
      startIndex: preMatchPhaseState.startIndex,
      endIndex: preMatchPhaseState.endIndex,
      destinationContents: preMatchPhaseState.destinationContents,
      titleContents: preMatchPhaseState.titleContents,
      openerDelimiter: preMatchPhaseState.openerDelimiter,
      middleDelimiter: preMatchPhaseState.middleDelimiter,
      closerDelimiter: preMatchPhaseState.closerDelimiter,
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
  ): ImageDataNode {
    const { codePositions } = rawContent

    // calc url
    let url = ''
    if (matchPhaseState.destinationContents != null) {
      let { startIndex, endIndex } = matchPhaseState.destinationContents
      if (codePositions[startIndex].codePoint === AsciiCodePoint.OPEN_ANGLE) {
        startIndex += 1
        endIndex -= 1
      }
      url = calcStringFromCodePointsIgnoreEscapes(
        codePositions, startIndex, endIndex)
    }

    // calc alt
    const alt = calcImageAlt(parsedChildren || [])

    // calc title
    let title: string | undefined
    if (matchPhaseState.titleContents != null) {
      const { startIndex, endIndex } = matchPhaseState.titleContents
      title = calcStringFromCodePointsIgnoreEscapes(
        codePositions, startIndex + 1, endIndex -1)
    }

    const result: ImageDataNode = {
      type: ImageDataNodeType,
      url,
      alt,
      title,
    }
    return result
  }
}
