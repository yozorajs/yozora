import { InlineDataNodeType, TextDataNodeData } from '@yozora/core'
import { DataNodeTokenPosition, DataNodeTokenPointDetail } from '../../types/position'
import { DataNodeTokenizer } from '../../types/tokenizer'
import { BaseInlineDataNodeTokenizer } from './_base'


type T = InlineDataNodeType.TEXT
const acceptedTypes: T[] = [InlineDataNodeType.TEXT]


export interface TextEatingState {

}


/**
 * 匹配得到的结果
 */
export interface TextMatchedResultItem extends DataNodeTokenPosition<T> {

}



/**
 * Lexical Analyzer for TextDataNode
 */
export class TextTokenizer extends BaseInlineDataNodeTokenizer<
  T, TextMatchedResultItem,
  TextDataNodeData, TextEatingState>
  implements DataNodeTokenizer<T> {
  public readonly name = 'TextTokenizer'
  public readonly acceptedTypes = acceptedTypes

  /**
   * override
   */
  protected eatTo(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    precedingTokenPosition: DataNodeTokenPosition<InlineDataNodeType> | null,
    state: TextEatingState,
    startOffset: number,
    endOffset: number,
    result: TextMatchedResultItem[],
  ): void {
    if (startOffset >= endOffset) return
    result.push({
      type: InlineDataNodeType.TEXT,
      left: { start: startOffset, end: startOffset, thickness: 0 },
      right: { start: endOffset, end: endOffset, thickness: 0 },
      children: [],
    })
  }


  /**
   * 解析匹配到的内容
   */
  protected parseData(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: TextMatchedResultItem,
  ): TextDataNodeData {
    const start: DataNodeTokenPointDetail = codePoints[tokenPosition.left.end]
    const end: DataNodeTokenPointDetail = codePoints[tokenPosition.right.start]
    return {
      value: content.substring(start.offset, end.offset),
    }
  }
}
