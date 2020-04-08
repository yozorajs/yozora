import {
  BaseInlineDataNodeTokenizer,
  DataNodeTokenPointDetail,
  InlineDataNodeMatchResult,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
  calcStringFromCodePointsIgnoreEscapes,
} from '@yozora/tokenizer-core'
import { TextDataNodeType, TextDataNodeData } from './types'


type T = TextDataNodeType


export interface TextMatchState{

}


export interface TextMatchedResultItem extends InlineDataNodeMatchResult<T> {

}


/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  TextDataNodeData,
  TextMatchState,
  TextMatchedResultItem
  >
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'TextTokenizer'
  public readonly recognizedTypes: T[] = [TextDataNodeType]

  /**
   * override
   */
  protected eatTo(
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: TextMatchState,
    startIndex: number,
    endIndex: number,
    result: TextMatchedResultItem[],
  ): void {
    if (startIndex >= endIndex) return
    result.push({
      type: TextDataNodeType,
      left: { start: startIndex, end: startIndex, thickness: 0 },
      right: { start: endIndex, end: endIndex, thickness: 0 },
      children: [],
    })
  }

  /**
   * override
   */
  protected parseData(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: TextMatchedResultItem,
  ): TextDataNodeData {
    const start: number = matchResult.left.end
    const end: number = matchResult.right.start
    const value: string = calcStringFromCodePointsIgnoreEscapes(codePoints, start, end)
    return { value }
  }
}
