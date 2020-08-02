import { calcStringFromCodePointsIgnoreEscapes } from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  NextParamsOfEatDelimiters,
  RawContent,
} from '@yozora/tokenizercore-inline'
import {
  TextDataNode,
  TextDataNodeType,
  TextMatchPhaseState,
  TextPotentialToken,
  TextTokenDelimiter,
} from './types'


type T = TextDataNodeType


/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerMatchPhaseHook<
      T,
      TextMatchPhaseState,
      TextTokenDelimiter,
      TextPotentialToken>,
    InlineTokenizerParsePhaseHook<
      T,
      TextMatchPhaseState,
      TextDataNode>
{
  public readonly name = 'TextTokenizer'
  public readonly uniqueTypes: T[] = [TextDataNodeType]

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public * eatDelimiters(

  ): Iterator<void, TextTokenDelimiter[], NextParamsOfEatDelimiters | null> {
    const delimiters: TextTokenDelimiter[] = []
    while (true) {
      const nextParams = yield
      if (nextParams == null) break

      const delimiter: TextTokenDelimiter = {
        type: 'both',
        startIndex: nextParams.startIndex,
        endIndex: nextParams.endIndex,
        thickness: 0,
      }
      delimiters.push(delimiter)
    }
    return delimiters
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    rawContent: RawContent,
    delimiters: TextTokenDelimiter[],
  ): TextPotentialToken[] {
    const potentialTokens: TextPotentialToken[] = []
    for (const delimiter of delimiters) {
      const potentialToken: TextPotentialToken = {
        type: TextDataNodeType,
        startIndex: delimiter.startIndex,
        endIndex: delimiter.endIndex,
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
    potentialToken: TextPotentialToken,
  ): TextMatchPhaseState | null {
    const result: TextMatchPhaseState = {
      type: TextDataNodeType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    rawContent: RawContent,
    matchPhaseState: TextMatchPhaseState,
  ): TextDataNode {
    const { startIndex, endIndex } = matchPhaseState
    const value: string = calcStringFromCodePointsIgnoreEscapes(
      rawContent.codePositions, startIndex, endIndex)
    const result: TextDataNode = {
      type: TextDataNodeType,
      value,
    }
    return result
  }
}
