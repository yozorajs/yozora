import { AsciiCodePoint } from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlinePotentialTokenItem,
  InlineTokenDelimiterItem,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerPreMatchPhaseHook,
} from '@yozora/tokenizercore-inline'
import {
  InlineCodeDataNode,
  InlineCodeDataNodeType,
  InlineCodeMatchPhaseState,
  InlineCodePreMatchPhaseState,
} from './types'


type T = InlineCodeDataNodeType


/**
 * Lexical Analyzer for InlineCodeDataNode
 */
export class InlineCodeTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerPreMatchPhaseHook<
      T,
      InlineCodePreMatchPhaseState>,
    InlineTokenizerMatchPhaseHook<
      T,
      InlineCodePreMatchPhaseState,
      InlineCodeMatchPhaseState>,
    InlineTokenizerParsePhaseHook<
      T,
      InlineCodeMatchPhaseState,
      InlineCodeDataNode>
{
  public readonly name = 'InlineCodeTokenizer'
  public readonly uniqueTypes: T[] = [InlineCodeDataNodeType]

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatDelimiters(
    codePositions: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    delimiters: InlineTokenDelimiterItem[],
  ): void {
    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePositions[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          /**
           * Note that backslash escapes do not work in code spans.
           * All backslashes are treated literally
           * @see https://github.github.com/gfm/#example-348
           */
          if (
            i + 1 < endIndex
            && codePositions[i + 1].codePoint !== AsciiCodePoint.BACKTICK) {
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
          while (i + 1 < endIndex && codePositions[i + 1].codePoint === p.codePoint) {
            i += 1
          }

          const delimiter: InlineTokenDelimiterItem = {
            potentialType: 'both',
            startIndex: _startIndex,
            endIndex: i  + 1,
            thickness: i - _startIndex + 1,
          }
          delimiters.push(delimiter)
          break
        }
      }
    }
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatTokens(
    codePositions: DataNodeTokenPointDetail[],
    delimiters: InlineTokenDelimiterItem[],
  ): InlinePotentialTokenItem<T>[] {
    const tokens: InlinePotentialTokenItem<T>[] = []
    for (let i = 0; i < delimiters.length; ++i) {
      const opener = delimiters[i]
      if (opener.potentialType === 'closer') continue

      let closer: InlineTokenDelimiterItem | null = null
      let k = i + 1
      for (; k < delimiters.length; ++k) {
        closer = delimiters[k]
        if (closer.potentialType === 'opener') continue

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

      const token: InlinePotentialTokenItem<T> = {
        type: InlineCodeDataNodeType,
        startIndex: opener.startIndex,
        endIndex: closer!.endIndex,
        leftDelimiter: opener,
        rightDelimiter: closer!,
      }
      tokens.push(token)
    }
    return tokens
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    codePositions: DataNodeTokenPointDetail[],
    token: InlinePotentialTokenItem<T>,
  ): InlineCodePreMatchPhaseState {
    const result: InlineCodePreMatchPhaseState = {
      type: InlineCodeDataNodeType,
      startIndex: token.startIndex,
      endIndex: token.endIndex,
      leftDelimiter: token.leftDelimiter!,
      rightDelimiter: token.rightDelimiter!,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    codePositions: DataNodeTokenPointDetail[],
    preMatchPhaseState: InlineCodePreMatchPhaseState,
  ): InlineCodeMatchPhaseState | false {
    const self = this
    let startIndex: number = preMatchPhaseState.leftDelimiter.endIndex
    let endIndex: number = preMatchPhaseState.rightDelimiter.startIndex

    let isAllSpace = true
    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePositions[i]
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
      const firstCharacter = codePositions[startIndex]
      const lastCharacter = codePositions[endIndex - 1]
      if (self.isSpaceLike(firstCharacter) && self.isSpaceLike(lastCharacter)) {
        startIndex += 1
        endIndex -= 1
      }
    }

    const result: InlineCodeMatchPhaseState = {
      type: InlineCodeDataNodeType,
      startIndex: preMatchPhaseState.startIndex,
      endIndex: preMatchPhaseState.endIndex,
      leftDelimiter: preMatchPhaseState.leftDelimiter!,
      rightDelimiter: preMatchPhaseState.rightDelimiter!,
      contents: { startIndex, endIndex },
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    codePositions: DataNodeTokenPointDetail[],
    matchPhaseState: InlineCodeMatchPhaseState,
  ): InlineCodeDataNode {
    const self = this

    const { contents } = matchPhaseState
    const result: InlineCodeDataNode = {
      type: InlineCodeDataNodeType,
      value: codePositions.slice(contents.startIndex, contents.endIndex)
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
  protected isSpaceLike(c: DataNodeTokenPointDetail) {
    return (
      c.codePoint === AsciiCodePoint.SPACE
      || c.codePoint === AsciiCodePoint.LINE_FEED
    )
  }
}
