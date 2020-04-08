import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeMatchResult,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
  BlockDataNodeMatchState,
  InlineDataNodeParseFunc,
} from '@yozora/tokenizer-core'
import { ParagraphDataNodeData, ParagraphDataNodeType, ParagraphDataNode } from './types'


type T = ParagraphDataNodeType


export interface ParagraphDataNodeMatchResult extends BlockDataNodeMatchResult<T> {

}


export interface ParagraphDataNodeMatchState extends BlockDataNodeMatchState<T> {
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
  ParagraphDataNodeMatchState,
  ParagraphDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  ParagraphDataNodeData,
  ParagraphDataNodeMatchState,
  ParagraphDataNodeMatchResult> {
  public readonly name = 'ParagraphTokenizer'
  public readonly recognizedTypes: T[] = [ParagraphDataNodeType]

  /**
   * override
   */
  public eatMarker(
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    parent: BlockDataNodeMatchState,
  ): [number, ParagraphDataNodeMatchState | null] {
    const state: ParagraphDataNodeMatchState = {
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
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    state: ParagraphDataNodeMatchState,
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
  public eatLazyContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
    state: ParagraphDataNodeMatchState,
  ): [number, boolean] {
    return this.eatContinuationText(codePoints, startIndex, endIndex, state)
  }

  /**
   *
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: ParagraphDataNodeMatchResult,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeParseFunc,
  ): ParagraphDataNode {
    return { } as any
  }
}
