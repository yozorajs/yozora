import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  BaseInlineTokenizer,
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
  DeleteDataNode,
  DeleteDataNodeType,
  DeleteMatchPhaseState,
  DeletePotentialToken,
  DeletePreMatchPhaseState,
  DeleteTokenDelimiter,
} from './types'


type T = DeleteDataNodeType



/**
 * Lexical Analyzer for DeleteDataNode
 */
export class DeleteTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerPreMatchPhaseHook<
      T,
      DeletePreMatchPhaseState,
      DeleteTokenDelimiter,
      DeletePotentialToken>,
    InlineTokenizerMatchPhaseHook<
      T,
      DeletePreMatchPhaseState,
      DeleteMatchPhaseState>,
    InlineTokenizerParsePhaseHook<
      T,
      DeleteMatchPhaseState,
      DeleteDataNode>
{
  public readonly name = 'DeleteTokenizer'
  public readonly uniqueTypes: T[] = [DeleteDataNodeType]

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public * eatDelimiters(
    rawContent: RawContent,
  ): Iterator<void, DeleteTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const { codePositions } = rawContent
    const delimiters: DeleteTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const { startIndex, endIndex, precedingCodePosition, followingCodePosition } = nextParams
      for (let i = startIndex; i < endIndex; ++i) {
        const p = codePositions[i]
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
            while (i + 1 < endIndex && codePositions[i + 1].codePoint === p.codePoint) {
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
              : codePositions[_startIndex - 1]
            if (preceding != null && isWhiteSpaceCharacter(preceding.codePoint)) {
              delimiterType = 'opener'
            }

            /**
             * If the following character is a whitespace, it cannot be used as a
             * opener delimiter
             */
            const following = (i + 1 === endIndex)
              ? followingCodePosition
              : codePositions[i + 1]
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
              thickness: 2,
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
            type: DeleteDataNodeType,
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
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    rawContent: RawContent,
    potentialToken: DeletePotentialToken,
    innerState: InlineTokenizerPreMatchPhaseState[],
  ): DeletePreMatchPhaseState {
    const result: DeletePreMatchPhaseState = {
      type: DeleteDataNodeType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      openerDelimiter: potentialToken.openerDelimiter,
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
    preMatchPhaseState: DeletePreMatchPhaseState,
  ): DeleteMatchPhaseState | false {
    const result: DeleteMatchPhaseState = {
      type: DeleteDataNodeType,
      startIndex: preMatchPhaseState.startIndex,
      endIndex: preMatchPhaseState.endIndex,
      openerDelimiter: preMatchPhaseState.openerDelimiter,
      closerDelimiter: preMatchPhaseState.closerDelimiter,
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
  ): DeleteDataNode {
    const result: DeleteDataNode = {
      type: DeleteDataNodeType,
      children: parsedChildren || [],
    }
    return result
  }
}
