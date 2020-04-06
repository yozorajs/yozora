import {
  BaseInlineDataNodeTokenizer,
  DataNodeTokenPointDetail,
  InlineDataNodeTokenPosition,
  InlineDataNodeTokenizer,
  InlineDataNodeType,
  calcStringFromCodePointsIgnoreEscapes,
} from '@yozora/tokenizer-core'
import { TextDataNodeType, TextDataNodeData } from './types'


type T = TextDataNodeType


export interface TextEatingState {

}


export interface TextMatchedResultItem extends InlineDataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer extends BaseInlineDataNodeTokenizer<
  T,
  TextDataNodeData,
  TextMatchedResultItem,
  TextEatingState>
  implements InlineDataNodeTokenizer<T> {
  public readonly name = 'TextTokenizer'
  public readonly recognizedTypes: T[] = [TextDataNodeType]

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: InlineDataNodeTokenPosition<InlineDataNodeType> | null,
    state: TextEatingState,
    startOffset: number,
    endOffset: number,
    result: TextMatchedResultItem[],
  ): void {
    if (startOffset >= endOffset) return
    result.push({
      type: TextDataNodeType,
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
