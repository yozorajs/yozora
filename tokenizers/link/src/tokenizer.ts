import type {
  EnhancedYastNodePoint,
  YastMeta as M,
} from '@yozora/tokenizercore'
import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerProps,
  ResultOfEatDelimiters,
  ResultOfEatPotentialTokens,
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
  eatLinkDestination,
  eatLinkTitle,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { LinkType } from './types'


type PT = InlinePotentialToken<T>


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
export class LinkTokenizer extends BaseInlineTokenizer<T> implements
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS>
{
  public readonly name = 'LinkTokenizer'
  public readonly uniqueTypes: T[] = [LinkType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
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
  public * eatDelimiters(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
  ): ResultOfEatDelimiters<TD> {
    const delimiters: TD[] = []
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
            const openerDelimiter: TD = {
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
            const _endIndex =
              eatOptionalWhiteSpaces(nodePoints, titleEndIndex, endIndex) + 1
            if (
              _endIndex > endIndex ||
              nodePoints[_endIndex - 1].codePoint !== AsciiCodePoint.CLOSE_PARENTHESIS
            ) break

            /**
             * Both the title and the destination may be omitted
             * @see https://github.github.com/gfm/#example-495
             */
            const closerDelimiter: TD = {
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
   * @override
   * @see InlineTokenizerMatchPhaseHook
   */
  public eatPotentialTokens(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    delimiters: TD[],
  ): ResultOfEatPotentialTokens<T> {
    const results: PT[] = []

    /**
     * Links can not contains Links, so we can always only use the latest
     * opener Delimiter to pair with the current closer Delimiter
     */
    for (let openerDelimiter: TD | null = null, i = 0; i < delimiters.length; ++i) {
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

        const state: MS = {
          type: LinkType,
          destinationContents: closerDelimiter.destinationContents,
          titleContents: closerDelimiter.titleContents,
          openerDelimiter: opener,
          middleDelimiter: middle,
          closerDelimiter: closer,
        }
        results.push({
          state,
          startIndex: opener.startIndex,
          endIndex: closer.endIndex,
          innerRawContents: [{
            startIndex: opener.endIndex,
            endIndex: middle.startIndex,
          }]
        })

        // reset openerDelimiter
        openerDelimiter = null
        continue
      }
    }

    return results
  }

  /**
   * @override
   * @see InlineTokenizerParsePhaseHook
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    matchPhaseState: MS,
    parsedChildren?: YastInlineNode[],
  ): PS {
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

    const result: PS = {
      type: LinkType,
      url,
      title,
      children: parsedChildren || [],
    }
    return result
  }
}
