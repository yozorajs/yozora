import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  NextParamsOfEatDelimiters,
  RawContent,
} from '@yozora/tokenizercore-inline'
import type {
  InlineCode,
  InlineCodeMatchPhaseState,
  InlineCodePotentialToken,
  InlineCodeTokenDelimiter,
  InlineCodeType as T,
} from './types'
import { AsciiCodePoint } from '@yozora/character'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { InlineCodeType } from './types'


/**
 * Lexical Analyzer for InlineCode
 */
export class InlineCodeTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerMatchPhaseHook<
      T,
      InlineCodeMatchPhaseState,
      InlineCodeTokenDelimiter,
      InlineCodePotentialToken>,
    InlineTokenizerParsePhaseHook<
      T,
      InlineCodeMatchPhaseState,
      InlineCode>
{
  public readonly name = 'InlineCodeTokenizer'
  public readonly uniqueTypes: T[] = [InlineCodeType]

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public * eatDelimiters(
    rawContent: RawContent,
  ): Iterator<void, InlineCodeTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { nodePoints } = rawContent
    const delimiters: InlineCodeTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            /**
             * Note that backslash escapes do not work in code spans.
             * All backslashes are treated literally
             * @see https://github.github.com/gfm/#example-348
             */
            if (
              i + 1 < endIndex
              && nodePoints[i + 1].codePoint !== AsciiCodePoint.BACKTICK) {
              i += 1
            }
            break
          /**
           * A backtick string is a string of one or more backtick characters '`'
           * that is neither preceded nor followed by a backtick.
           * A code span begins with a backtick string and ends with a
           * backtick string of equal length.
           * @see https://github.github.com/gfm/#backtick-string
           * @see https://github.github.com/gfm/#code-span
           */
          case AsciiCodePoint.BACKTICK: {
            const _startIndex = i

            // matched as many backtick as possible
            while (i + 1 < endIndex && nodePoints[i + 1].codePoint === p.codePoint) {
              i += 1
            }

            const delimiter: InlineCodeTokenDelimiter = {
              type: 'both',
              startIndex: _startIndex,
              endIndex: i + 1,
              thickness: i - _startIndex + 1,
            }
            delimiters.push(delimiter)
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
    delimiters: InlineCodeTokenDelimiter[],
  ): InlineCodePotentialToken[] {
    const potentialTokens: InlineCodePotentialToken[] = []
    for (let i = 0; i < delimiters.length; ++i) {
      const opener = delimiters[i]
      if (opener.type === 'closer') continue

      let closer: InlineCodeTokenDelimiter | null = null
      let k = i + 1
      for (; k < delimiters.length; ++k) {
        closer = delimiters[k]
        if (closer.type === 'opener') continue

        /**
         * Backslash escapes are never needed, because one can always choose a
         * string of n backtick characters as delimiters, where the code does
         * not contain any strings of exactly n backtick characters.
         * @see https://github.github.com/gfm/#example-349
         * @see https://github.github.com/gfm/#example-350
         */
        if (closer.thickness !== opener.thickness) continue
        break
      }

      /**
       * When a backtick string is not closed by a matching backtick string,
       * we just have literal backticks
       * @see https://github.github.com/gfm/#example-357
       * @see https://github.github.com/gfm/#example-358
       *
       * The following case also illustrates the need for opening and closing
       * backtick strings to be equal in length
       * @see https://github.github.com/gfm/#example-359
       */
      if (k >= delimiters.length) continue

      const potentialToken: InlineCodePotentialToken = {
        type: InlineCodeType,
        startIndex: opener.startIndex,
        endIndex: closer!.endIndex,
        openerDelimiter: opener,
        closerDelimiter: closer!,
      }
      potentialTokens.push(potentialToken)
    }
    return potentialTokens
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    potentialToken: InlineCodePotentialToken,
  ): InlineCodeMatchPhaseState | null {
    const self = this
    const { nodePoints } = rawContent
    let startIndex: number = potentialToken.openerDelimiter.endIndex
    let endIndex: number = potentialToken.closerDelimiter.startIndex

    let isAllSpace = true
    for (let i = startIndex; i < endIndex; ++i) {
      const p = nodePoints[i]
      if (self.isSpaceLike(p)) continue
      isAllSpace = false
      break
    }

    /**
     * If the resulting string both begins and ends with a space character,
     * but doesn't consist entirely of space characters, a single space
     * character is removed from the front and back. This allows you to
     * include code that begins or endsWith backtick characters, which must
     * be separated by whitespace from theopening or closing backtick strings.
     * @see https://github.github.com/gfm/#example-340
     *
     * Only spaces, and not unicode whitespace in general, are stripped
     * in this way
     * @see https://github.github.com/gfm/#example-343
     *
     * No stripping occurs if the code span contains only spaces
     * @see https://github.github.com/gfm/#example-344
     */
    if (!isAllSpace && startIndex + 2 < endIndex) {
      const firstCharacter = nodePoints[startIndex]
      const lastCharacter = nodePoints[endIndex - 1]
      if (self.isSpaceLike(firstCharacter) && self.isSpaceLike(lastCharacter)) {
        startIndex += 1
        endIndex -= 1
      }
    }

    const result: InlineCodeMatchPhaseState = {
      type: InlineCodeType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      openerDelimiter: potentialToken.openerDelimiter,
      closerDelimiter: potentialToken.closerDelimiter,
      contents: { startIndex, endIndex },
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: InlineCodeMatchPhaseState,
  ): InlineCode {
    const self = this
    const { nodePoints } = rawContent
    const { contents } = matchPhaseState
    const result: InlineCode = {
      type: InlineCodeType,
      value: nodePoints.slice(contents.startIndex, contents.endIndex)
        .map(c => (self.isSpaceLike(c) ? ' ' : String.fromCodePoint(c.codePoint)))
        .join(''),
    }
    return result
  }

  /**
   * Line endings are treated like spaces
   * @see https://github.github.com/gfm/#example-345
   * @see https://github.github.com/gfm/#example-346
   */
  protected isSpaceLike(c: YastNodePoint): boolean {
    return (
      c.codePoint === AsciiCodePoint.SPACE
      || c.codePoint === AsciiCodePoint.LINE_FEED
    )
  }
}
