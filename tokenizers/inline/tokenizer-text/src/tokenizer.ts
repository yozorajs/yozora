import {
  DataNodeTokenPointDetail,
  calcStringFromCodePointsIgnoreEscapes,
} from '@yozora/tokenizercore'
import {
  BaseInlineTokenizer,
  InlineTokenizer,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerPreMatchPhaseHook,
} from '@yozora/tokenizercore-inline'
import {
  TextDataNode,
  TextDataNodeType,
  TextMatchPhaseState,
  TextPotentialToken,
  TextPreMatchPhaseState,
  TextTokenDelimiter,
} from './types'


type T = TextDataNodeType


/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer extends BaseInlineTokenizer<T>
  implements
    InlineTokenizer<T>,
    InlineTokenizerPreMatchPhaseHook<
      T,
      TextPreMatchPhaseState,
      TextTokenDelimiter,
      TextPotentialToken>,
    InlineTokenizerMatchPhaseHook<
      T,
      TextPreMatchPhaseState,
      TextMatchPhaseState>,
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
  public eatDelimiters(
    codePositions: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    delimiters: TextTokenDelimiter[],
  ): void {
    const delimiter: TextTokenDelimiter = {
      type: 'both',
      startIndex,
      endIndex,
      thickness: 0,
    }
    delimiters.push(delimiter)
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatPotentialTokens(
    codePositions: DataNodeTokenPointDetail[],
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
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    codePositions: DataNodeTokenPointDetail[],
    potentialToken: TextPotentialToken,
  ): TextPreMatchPhaseState {
    const result: TextPreMatchPhaseState = {
      type: TextDataNodeType,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerMatchPhaseHook
   */
  public match(
    codePositions: DataNodeTokenPointDetail[],
    preMatchPhaseState: TextPreMatchPhaseState,
  ): TextMatchPhaseState | false {
    const result: TextMatchPhaseState = {
      type: TextDataNodeType,
      startIndex: preMatchPhaseState.startIndex,
      endIndex: preMatchPhaseState.endIndex,
    }
    return result
  }

  /**
   * hook of @InlineTokenizerParsePhaseHook
   */
  public parse(
    codePositions: DataNodeTokenPointDetail[],
    matchPhaseState: TextMatchPhaseState,
  ): TextDataNode {
    const { startIndex, endIndex } = matchPhaseState
    const value: string = calcStringFromCodePointsIgnoreEscapes(
      codePositions, startIndex, endIndex)
    const result: TextDataNode = {
      type: TextDataNodeType,
      value,
    }
    return result
  }
}
