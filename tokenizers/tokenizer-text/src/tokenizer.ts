import {
  InlineDataNodeTokenizer,
  BaseInlineDataNodeTokenizer,
  DataNodeTokenPointDetail,
  DataNodeTokenPosition,
  DataNodeType,
  calcStringFromCodePointsIgnoreEscapes,
} from '@yozora/tokenizer-core'
import { TextDataType, TextDataNodeData } from './types'


type T = TextDataType


export interface TextEatingState {

}


export interface TextMatchedResultItem extends DataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  TextMatchedResultItem,
  TextDataNodeData,
  TextEatingState>
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'TextTokenizer'
  public readonly recognizedTypes: T[] = [TextDataType]

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<DataNodeType> | null,
    state: TextEatingState,
    startOffset: number,
    endOffset: number,
    result: TextMatchedResultItem[],
  ): void {
    if (startOffset >= endOffset) return
    result.push({
      type: TextDataType,
      left: { start: startOffset, end: startOffset, thickness: 0 },
      right: { start: endOffset, end: endOffset, thickness: 0 },
      children: [],
    })
  }

  /**
   * override
   */
  protected parseData(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: TextMatchedResultItem,
  ): TextDataNodeData {
    const start: number = tokenPosition.left.end
    const end: number = tokenPosition.right.start
    const value: string = calcStringFromCodePointsIgnoreEscapes(codePoints, start, end)
    return { value }
  }
}
