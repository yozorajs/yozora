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
  Link,
  LinkMatchPhaseState,
  LinkPotentialToken,
  LinkTokenDelimiter,
  LinkType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import {
  calcStringFromNodePointsIgnoreEscapes,
  eatLinkDestination,
  eatLinkTitle,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { LinkType } from './types'


/**
 * Lexical Analyzer for InlineLink
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
  InlineTokenizerMatchPhaseHook<
    T,
    LinkMatchPhaseState,
    LinkTokenDelimiter,
    LinkPotentialToken>,
  InlineTokenizerParsePhaseHook<
    T,
    LinkMatchPhaseState,
    Link>
{
  public readonly name = 'LinkTokenizer'
  public readonly uniqueTypes: T[] = [LinkType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

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
    const { nodePoints } = rawContent
    const delimiters: LinkTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        const p = nodePoints[i]
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
              nodePoints[i + 1].codePoint !== AsciiCodePoint.OPEN_PARENTHESIS
            ) break

            // try to match link destination
            const destinationStartIndex = eatOptionalWhiteSpaces(
              nodePoints, i + 2, endIndex)
            const destinationEndIndex = eatLinkDestination(
              nodePoints, destinationStartIndex, endIndex)
            if (destinationEndIndex < 0) break // no valid destination matched

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
            const closerDelimiter: LinkTokenDelimiter = {
              type: 'closer',
              startIndex: _startIndex,
              endIndex: _endIndex,
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

        const opener: InlineTokenDelimiter = {
          type: 'opener',
          startIndex: openerDelimiter.startIndex,
          endIndex: openerDelimiter.endIndex,
        }

        const middle: InlineTokenDelimiter = {
          type: 'middle',
          startIndex: closerDelimiter.startIndex,
          endIndex: closerDelimiter.startIndex + 2,
        }

        const closer: InlineTokenDelimiter = {
          type: 'closer',
          startIndex: closerDelimiter.endIndex - 1,
          endIndex: closerDelimiter.endIndex,
        }

        const potentialToken: LinkPotentialToken = {
          type: LinkType,
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
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    potentialToken: LinkPotentialToken,
    innerStates: InlineTokenizerMatchPhaseState[],
  ): LinkMatchPhaseState | null {
    const result: LinkMatchPhaseState = {
      type: LinkType,
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
    matchPhaseState: LinkMatchPhaseState,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ): Link {
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

    // calc title
    let title: string | undefined
    if (matchPhaseState.titleContents != null) {
      const { startIndex, endIndex } = matchPhaseState.titleContents
      title = calcStringFromNodePointsIgnoreEscapes(
        nodePoints, startIndex + 1, endIndex - 1)
    }

    const result: Link = {
      type: LinkType,
      url,
      title,
      children: parsedChildren || [],
    }
    return result
  }
}
