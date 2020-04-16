import {
  BaseBlockDataNodeTokenizer,
  BlockDataNode,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
  InlineDataNodeParseFunc,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/tokenizer-core'
import {
  ParagraphDataNode,
  ParagraphDataNodeData,
  ParagraphDataNodeType,
} from './types'


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
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
  ): [number, ParagraphDataNodeMatchState | null] {
    if (eatingLineInfo.isBlankLine) return [-1, null]
    const { endIndex, firstNonWhiteSpaceIndex } = eatingLineInfo
    const state: ParagraphDataNodeMatchState = {
      type: ParagraphDataNodeType,
      opening: true,
      codePoints: codePoints.slice(firstNonWhiteSpaceIndex, endIndex),
    }
    return [endIndex, state]
  }

  /**
   * override
   */
  public eatContinuationText(): [number, boolean] {
    return [-1, false]
  }

  /**
   * override
   */
  public eatLazyContinuationText(
    codePoints: DataNodeTokenPointDetail[],
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    state: ParagraphDataNodeMatchState,
  ): [number, boolean] {
    if (eatingLineInfo.isBlankLine) return [-1, false]
    const { endIndex, firstNonWhiteSpaceIndex } = eatingLineInfo
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      state.codePoints.push(codePoints[i])
    }
    return [endIndex, true]
  }

  /**
   * override
   */
  public closeMatchState(state: ParagraphDataNodeMatchState): void {
    // do trim
    const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(state.codePoints)
    if (rightIndex - leftIndex < state.codePoints.length) {
      // eslint-disable-next-line no-param-reassign
      state.codePoints = state.codePoints.slice(leftIndex, rightIndex)
    }
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
