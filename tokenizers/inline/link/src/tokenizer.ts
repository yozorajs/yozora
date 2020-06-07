import { AsciiCodePoint } from '@yozora/character'
import {
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
} from '@yozora/tokenizercore-inline'
import {
  LinkDataNode,
  LinkDataNodeType,
  LinkMatchPhaseState,
  LinkPotentialToken,
  LinkPreMatchPhaseState,
  LinkTokenDelimiter,
} from './types'


type T = LinkDataNodeType


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
export class LinkTokenizer extends BaseInlineTokenizer<T>
implements
  InlineTokenizer<T>,
  InlineTokenizerPreMatchPhaseHook<
    T,
    LinkPreMatchPhaseState,
    LinkTokenDelimiter,
    LinkPotentialToken>,
  InlineTokenizerMatchPhaseHook<
    T,
    LinkPreMatchPhaseState,
    LinkMatchPhaseState>,
  InlineTokenizerParsePhaseHook<
    T,
    LinkMatchPhaseState,
    LinkDataNode>
{
  public readonly name = 'LinkTokenizer'
  public readonly uniqueTypes: T[] = [LinkDataNodeType]

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   *
   * An inline link consists of a link text followed immediately by a left
   * parenthesis '(', optional whitespace, an optional link destination, an
   * optional link title separated from the link destination by whitespace,
   * optional whitespace, and a right parenthesis ')'
   * @see https://github.github.com/gfm/#inline-link
   *
   */
  public * eatDelimiters(
    rawContent: RawContent,
  ): Iterator<void, LinkTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { codePositions } = rawContent
    const delimiters: LinkTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        const p = codePositions[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          /**
           * A link text consists of a sequence of zero or more inline elements
           * enclosed by square brackets ([ and ])
           * @see https://github.github.com/gfm/#link-text
           */
          case AsciiCodePoint.OPEN_BRACKET: {
            const openerDelimiter: LinkTokenDelimiter = {
              type: 'opener',
              startIndex: i,
              endIndex: i + 1,
              thickness: 1,
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
             * Cause links may not contain other links, at any level of nesting,
             * so middleDelimiter must be adjacent to LeftDelimiter
             *
             * @see https://github.github.com/gfm/#example-526
             * @see https://github.github.com/gfm/#example-527
             */
            if (
              delimiters.length <= 0 ||
              delimiters[delimiters.length - 1].type !== 'opener'
            ) break

            /**
             * The link text may contain balanced brackets, but not unbalanced
             * ones, unless they are escaped.
             *
             * So no matter whether the current delimiter is a legal
             * closerDelimiter, it needs to consume a open bracket.
             * @see https://github.github.com/gfm/#example-520
             */
            const openerDelimiter = delimiters.pop()!

            /**
             * Cause link destination and link title cannot contain other tokens,
             * therefore, the closerDelimiter must appear in the current iteration
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
            if (destinationEndIndex < 0) break // no valid destination matched

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
            const closerDelimiter: LinkTokenDelimiter = {
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
             * push the openerDelimiter that was previously popped back onto the
             * delimiter stack
             */
            delimiters.push(openerDelimiter)
            delimiters.push(closerDelimiter)

            i = _endIndex - 1
            break
          }
        }
      }
    }
    return delimiters
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: LinkTokenDelimiter[],
  ): LinkPotentialToken[] {
    const potentialTokens: LinkPotentialToken[] = []

    /**
     * Links can not contains Links, so we can always only use the latest
     * opener Delimiter to pair with the current closer Delimiter
     */
    let openerDelimiter: LinkTokenDelimiter | null = null
    for (let i = 0; i < delimiters.length; ++i) {
      const delimiter = delimiters[i]

      if (delimiter.type === 'opener') {
        openerDelimiter = delimiter
        continue
      }

      if (delimiter.type === 'closer') {
        if (openerDelimiter == null) continue
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

        const potentialToken: LinkPotentialToken = {
          type: LinkDataNodeType,
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

        // reset openerDelimiter
        openerDelimiter = null
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
    potentialToken: LinkPotentialToken,
    innerState: InlineTokenizerPreMatchPhaseState[],
  ): LinkPreMatchPhaseState {
    const result: LinkPreMatchPhaseState = {
      type: LinkDataNodeType,
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
    preMatchPhaseState: LinkPreMatchPhaseState,
  ): LinkMatchPhaseState | false {
    const result: LinkMatchPhaseState = {
      type: LinkDataNodeType,
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
    matchPhaseState: LinkMatchPhaseState,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ): LinkDataNode {
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

    // calc title
    let title: string | undefined
    if (matchPhaseState.titleContents != null) {
      const { startIndex, endIndex } = matchPhaseState.titleContents
      title = calcStringFromCodePointsIgnoreEscapes(
        codePositions, startIndex + 1, endIndex -1)
    }

    const result: LinkDataNode = {
      type: LinkDataNodeType,
      url,
      title,
      children: parsedChildren || [],
    }
    return result
  }
}
