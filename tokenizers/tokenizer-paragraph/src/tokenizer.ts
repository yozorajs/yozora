import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeTokenPosition,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
} from '@yozora/tokenizer-core'
import { ParagraphDataNodeData, ParagraphDataNodeType } from './types'


type T = ParagraphDataNodeType


export interface ParagraphMatchedResultItem extends BlockDataNodeTokenPosition<T> {

}


/**
 * Lexical Analyzer for ParagraphDataNode
 */
export class ParagraphTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  ParagraphDataNodeData,
  ParagraphMatchedResultItem
  > implements BlockDataNodeTokenizer<T> {
  public readonly name = 'ParagraphTokenizer'
  public readonly recognizedTypes: T[] = [ParagraphDataNodeType]

  /**
   * override
   */
  public match(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
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
    children: BlockDataNode[],
  ): ParagraphDataNodeData {
    return { children }
  }
}
