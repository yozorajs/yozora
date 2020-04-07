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


export interface TextEatingState {

}


export interface TextMatchedResultItem extends InlineDataNodeMatchResult<T> {

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
    precedingTokenPosition: InlineDataNodeMatchResult<InlineDataNodeType> | null,
    state: TextEatingState,
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
