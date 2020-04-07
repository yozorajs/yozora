import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeMatchResult,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
  BlockDataNodeEatingState,
} from '@yozora/tokenizer-core'
import { ParagraphDataNodeData, ParagraphDataNodeType } from './types'


type T = ParagraphDataNodeType


export interface ParagraphMatchedResultItem extends BlockDataNodeMatchResult<T> {

}


export interface ParagraphDataNodeEatingState extends BlockDataNodeEatingState<T> {
  /**
   * paragraph 中的文本内容
   */
  codePoints: DataNodeTokenPointDetail[]
}


/**
 * Lexical Analyzer for ParagraphDataNode
 */
export class ParagraphTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  ParagraphDataNodeData,
  ParagraphDataNodeEatingState,
  ParagraphMatchedResultItem
  > implements BlockDataNodeTokenizer<T, ParagraphDataNodeEatingState, ParagraphMatchedResultItem> {
  public readonly name = 'ParagraphTokenizer'
  public readonly recognizedTypes: T[] = [ParagraphDataNodeType]

  /**
   * override
   */
  public eatMarker(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    parent: BlockDataNodeEatingState,
  ): [number, ParagraphDataNodeEatingState | null] {
    const state: ParagraphDataNodeEatingState = {
      type: ParagraphDataNodeType,
      opening: true,
      codePoints: codePoints.slice(startIndex, endIndex),
    }
    return [endIndex, state]
  }

  /**
   * override
   */
  public eatContinuationText(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    state: ParagraphDataNodeEatingState,
  ): [number, boolean] {
    for (let i = startIndex; i < endIndex; ++i) {
      state.codePoints.push(codePoints[i])
    }
    return [endIndex, true]
  }

  /**
   *
   * @returns [next index, matched success]
   */
  eatLazyContinuationText(
    content: string,
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    state: ParagraphDataNodeEatingState,
  ): [number, boolean] {
    return this.eatContinuationText(content, codePoints, startIndex, endIndex, state)
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
