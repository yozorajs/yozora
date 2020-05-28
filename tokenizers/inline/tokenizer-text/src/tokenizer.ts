import {
  DataNodeTokenPointDetail,
  calcStringFromCodePointsIgnoreEscapes,
} from '@yozora/tokenizercore'
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
  TextDataNode,
  TextDataNodeType,
  TextMatchPhaseState,
  TextPreMatchPhaseState,
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
      TextPreMatchPhaseState>,
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
    delimiters: InlineTokenDelimiterItem[],
  ): void {
    const delimiter: InlineTokenDelimiterItem = {
      potentialType: 'both',
      startIndex,
      endIndex,
      thickness: 0,
    }
    delimiters.push(delimiter)
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public eatTokens(
    codePositions: DataNodeTokenPointDetail[],
    delimiters: InlineTokenDelimiterItem[],
  ): InlinePotentialTokenItem<T>[] {
    const tokens = delimiters.map((delimiter): InlinePotentialTokenItem<T> => ({
      type: TextDataNodeType,
      startIndex: delimiter.startIndex,
      endIndex: delimiter.endIndex,
    }))
    return tokens
  }

  /**
   * hook of @InlineTokenizerPreMatchPhaseHook
   */
  public assemblePreMatchState(
    codePositions: DataNodeTokenPointDetail[],
    token: InlinePotentialTokenItem<T>,
  ): TextPreMatchPhaseState {
    const result: TextPreMatchPhaseState = {
      type: TextDataNodeType,
      startIndex: token.startIndex,
      endIndex: token.endIndex,
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
