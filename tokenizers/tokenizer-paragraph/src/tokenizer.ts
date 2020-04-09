import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeTokenizer,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  DataNodeTokenPointDetail,
  InlineDataNodeParseFunc,
  isUnicodeWhiteSpace,
} from '@yozora/tokenizer-core'
import { ParagraphDataNode, ParagraphDataNodeData, ParagraphDataNodeType } from './types'


type T = ParagraphDataNodeType


export interface ParagraphDataNodeMatchResult extends BlockDataNodeMatchResult<T> {
  /**
   * paragraph 中的文本内容
   */
  codePoints: DataNodeTokenPointDetail[]
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
   * override
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
   * override
   */
  public onStateClosed(state: ParagraphDataNodeMatchState): void {
    let rightIndex = 0
    let leftIndex = state.codePoints.length - 1
    for (; leftIndex <= rightIndex; ++leftIndex) {
      const c = state.codePoints[leftIndex]
      if (!isUnicodeWhiteSpace(c.codePoint)) break
    }
    for (; leftIndex <= rightIndex; --rightIndex) {
      const c = state.codePoints[rightIndex]
      if (!isUnicodeWhiteSpace(c.codePoint)) break
    }

    if (rightIndex - leftIndex + 1 === state.codePoints.length) return

    // do trim
    // eslint-disable-next-line no-param-reassign
    state.codePoints = state.codePoints.slice(leftIndex, rightIndex + 1)
  }

  /**
   * override
   */
  public parse(
    codePoints: DataNodeTokenPointDetail[],
    matchResult: ParagraphDataNodeMatchResult,
    children?: BlockDataNode[],
    parseInline?: InlineDataNodeParseFunc,
  ): ParagraphDataNode {
    const result: ParagraphDataNode = {
      type: ParagraphDataNodeType,
      data: {
        children: [],
      }
    }
    if (parseInline != null) {
      const innerData = parseInline(matchResult.codePoints, 0, matchResult.codePoints.length)
      result.data!.children = innerData
    }
    return result
  }
}