import {
  BaseBlockDataNodeTokenizer,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
  DataNodeTokenPosition,
  DataNode,
} from '@yozora/tokenizer-core'
import { ParagraphDataNodeType, ParagraphDataNodeData } from './types'


type T = ParagraphDataNodeType


export interface ParagraphMatchedResultItem extends DataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for ParagraphDataNode
 */
export class ParagraphTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  ParagraphMatchedResultItem,
  ParagraphDataNodeData
  >
  implements BlockDataNodeTokenizer<T> {
  public readonly name = 'ParagraphTokenizer'
  public readonly recognizedTypes: T[] = [ParagraphDataNodeType]

  /**
   * override
   */
  public match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startOffset: number,
    endOffset: number,
  ): ParagraphMatchedResultItem[] {
    return []
  }

  /**
   * override
   */
  protected parseData(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    tokenPosition: ParagraphMatchedResultItem,
    children: DataNode[],
  ): ParagraphDataNodeData {
    return { children }
  }
}
