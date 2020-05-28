import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlinePotentialTokenItem,
  InlineTokenDelimiterItem,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseHook,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'
import {
  DeleteDataNode,
  DeleteDataNodeType,
  DeleteMatchPhaseState,
  DeletePreMatchPhaseState,
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
      DeletePreMatchPhaseState>,
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
  public eatDelimiters(
    codePositions: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    delimiters: InlineTokenDelimiterItem[],
    precedingCodePosition: DataNodeTokenPointDetail | null,
    followingCodePosition: DataNodeTokenPointDetail | null,
  ): void {
    for (let i = startIndex; i < endIndex; ++i) {
      const p = codePositions[i]
      switch (p.codePoint) {
        case AsciiCodePoint.BACK_SLASH:
          ++i
          break
        /**
         * Strike through text is any text wrapped in two tildes '~'
         * @see https://github.github.com/gfm/#strikethrough-extension-
         */
        case AsciiCodePoint.TILDE: {
          const _startIndex = i
          while (i + 1 < endIndex && codePositions[i + 1].codePoint === p.codePoint) {
            ++i
          }
          if (i - _startIndex !== 1) break

          let potentialType: 'opener' | 'closer' | 'both' = 'both'

          /**
           * If the preceding character is a whitespace, it cannot be used as a
           * closer delimiter
           */
          const preceding = (_startIndex === startIndex)
            ? precedingCodePosition
            : codePositions[_startIndex - 1]
          if (preceding != null && isWhiteSpaceCharacter(preceding.codePoint)) {
            potentialType = 'opener'
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
            if (potentialType !== 'both') break
            potentialType = 'closer'
          }

          const delimiter: InlineTokenDelimiterItem = {
            potentialType,
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

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatTokens(
    codePositions: DataNodeTokenPointDetail[],
    delimiters: InlineTokenDelimiterItem[],
  ): InlinePotentialTokenItem<T>[] {
    const tokens: InlinePotentialTokenItem<T>[] = []
    for (let i = 0; i + 1 < delimiters.length; ++i) {
      const opener = delimiters[i]
      if (opener.potentialType === 'closer') continue
      const closer = delimiters[i + 1]
      if (closer.potentialType === 'opener') continue

      const token: InlinePotentialTokenItem<T> = {
        type: DeleteDataNodeType,
        startIndex: opener.startIndex,
        endIndex: closer.endIndex,
        leftDelimiter: opener,
        rightDelimiter: closer,
        innerRawContents: [{
          startIndex: opener.endIndex,
          endIndex: closer.startIndex,
        }]
      }
      tokens.push(token)
      ++i
    }
    return tokens
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    codePositions: DataNodeTokenPointDetail[],
    token: InlinePotentialTokenItem<T>,
    innerState: InlineTokenizerPreMatchPhaseState[],
  ): DeletePreMatchPhaseState {
    const result: DeletePreMatchPhaseState = {
      type: DeleteDataNodeType,
      startIndex: token.startIndex,
      endIndex: token.endIndex,
      leftDelimiter: token.leftDelimiter!,
      rightDelimiter: token.rightDelimiter!,
      children: innerState,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    codePositions: DataNodeTokenPointDetail[],
    preMatchPhaseState: DeletePreMatchPhaseState,
  ): DeleteMatchPhaseState | false {
    const result: DeleteMatchPhaseState = {
      type: DeleteDataNodeType,
      startIndex: preMatchPhaseState.startIndex,
      endIndex: preMatchPhaseState.endIndex,
      leftDelimiter: preMatchPhaseState.leftDelimiter!,
      rightDelimiter: preMatchPhaseState.rightDelimiter!,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    codePositions: DataNodeTokenPointDetail[],
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
