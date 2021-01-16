import type {
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
  Delete,
  DeleteMatchPhaseState,
  DeletePotentialToken,
  DeleteTokenDelimiter,
  DeleteType as T,
} from './types'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import { BaseInlineTokenizer } from '@yozora/tokenizercore-inline'
import { DeleteType } from './types'


/**
 * Lexical Analyzer for Delete
 */
export class DeleteTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerMatchPhaseHook<
      T,
      DeleteMatchPhaseState,
      DeleteTokenDelimiter,
      DeletePotentialToken>,
    InlineTokenizerParsePhaseHook<
      T,
      DeleteMatchPhaseState,
      Delete>
{
  public readonly name = 'DeleteTokenizer'
  public readonly uniqueTypes: T[] = [DeleteType]

  public constructor(props: InlineTokenizerProps) {
    super({ ...props })
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public * eatDelimiters(
    rawContent: RawContent,
  ): Iterator<void, DeleteTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { nodePoints } = rawContent
    const delimiters: DeleteTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex, precedingCodePosition, followingCodePosition } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        const p = nodePoints[i]
        switch (p.codePoint) {
          case AsciiCodePoint.BACK_SLASH:
            i += 1
            break
          /**
           * Strike through text is any text wrapped in two tildes '~'
           * @see https://github.github.com/gfm/#strikethrough-extension-
           */
          case AsciiCodePoint.TILDE: {
            const _startIndex = i
            while (i + 1 < endIndex && nodePoints[i + 1].codePoint === p.codePoint) {
              i += 1
            }
            if (i - _startIndex !== 1) break

            let delimiterType: 'opener' | 'closer' | 'both' = 'both'

            /**
             * If the preceding character is a whitespace, it cannot be used as a
             * closer delimiter
             */
            const preceding = (_startIndex === startIndex)
              ? precedingCodePosition
              : nodePoints[_startIndex - 1]
            if (preceding != null && isWhiteSpaceCharacter(preceding.codePoint)) {
              delimiterType = 'opener'
            }

            /**
             * If the following character is a whitespace, it cannot be used as a
             * opener delimiter
             */
            const following = (i + 1 === endIndex)
              ? followingCodePosition
              : nodePoints[i + 1]
            if (following != null && isWhiteSpaceCharacter(following.codePoint)) {
              /**
               * If it can neither be used as a opener or closer delimiter, it
               * is not a valid delimiter
               */
              if (delimiterType !== 'both') break
              delimiterType = 'closer'
            }

            const delimiter: DeleteTokenDelimiter = {
              type: delimiterType,
              startIndex: _startIndex,
              endIndex: i + 1,
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
    delimiters: DeleteTokenDelimiter[],
  ): DeletePotentialToken[] {
    const potentialTokens: DeletePotentialToken[] = []

    let opener: DeleteTokenDelimiter | null = null
    for (const delimiter of delimiters) {
      switch (delimiter.type) {
        case 'opener':
          opener = delimiter
          break
        case 'both':
          if (opener == null) {
            opener = delimiter
            break
          }
        case 'closer': {
          if (opener == null) break
          const closer = delimiter
          const potentialToken: DeletePotentialToken = {
            type: DeleteType,
            startIndex: opener.startIndex,
            endIndex: closer.endIndex,
            openerDelimiter: opener,
            closerDelimiter: closer,
            innerRawContents: [{
              startIndex: opener.endIndex,
              endIndex: closer.startIndex,
            }]
          }
          potentialTokens.push(potentialToken)
          break
        }
      }
    }
    return potentialTokens
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    rawContent: RawContent,
    potentialToken: DeletePotentialToken,
    innerState: InlineTokenizerMatchPhaseState[],
  ): DeleteMatchPhaseState | null {
    const result: DeleteMatchPhaseState = {
      type: DeleteType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      openerDelimiter: potentialToken.openerDelimiter,
      closerDelimiter: potentialToken.closerDelimiter,
      children: innerState,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: DeleteMatchPhaseState,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ): Delete {
    const result: Delete = {
      type: DeleteType,
      children: parsedChildren || [],
    }
    return result
  }
}
