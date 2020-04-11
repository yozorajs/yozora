import {
  BaseBlockDataNodeTokenizer,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  DataNodeTokenPointDetail,
  isUnicodeWhiteSpace,
  CodePoint,
} from '@yozora/tokenizer-core'
import { ThematicBreakDataNode, ThematicBreakDataNodeData, ThematicBreakDataNodeType } from './types'


type T = ThematicBreakDataNodeType


export interface ThematicBreakDataNodeMatchResult extends BlockDataNodeMatchResult<T> {

}


export interface ThematicBreakDataNodeMatchState extends BlockDataNodeMatchState<T> {

}


/**
 * Lexical Analyzer for ThematicBreakDataNode
 */
export class ThematicBreakTokenizer extends BaseBlockDataNodeTokenizer<
  T,
  ThematicBreakDataNodeData,
  ThematicBreakDataNodeMatchState,
  ThematicBreakDataNodeMatchResult>
  implements BlockDataNodeTokenizer<
  T,
  ThematicBreakDataNodeData,
  ThematicBreakDataNodeMatchState,
  ThematicBreakDataNodeMatchResult> {
  public readonly name = 'ThematicBreakTokenizer'
  public readonly recognizedTypes: T[] = [ThematicBreakDataNodeType]

  /**
   * override
   */
  public eatNewMarker(
    codePoints: DataNodeTokenPointDetail[],
    {
      endIndex,
      firstNonWhiteSpaceIndex,
    }: BlockDataNodeEatingLineInfo,
  ): [number, ThematicBreakDataNodeMatchState | null] {
    let marker: number
    let count = 0
    for (let i = firstNonWhiteSpaceIndex; i < endIndex; ++i) {
      const c = codePoints[i]
      if (isUnicodeWhiteSpace(c.codePoint)) continue
      switch (c.codePoint) {
        case CodePoint.HYPHEN:
        case CodePoint.UNDERSCORE:
        case CodePoint.ASTERISK: {
          if (count <= 0) {
            marker = c.codePoint
            ++count
            break
          }
          if (c.codePoint === marker!) {
            ++count
            break
          }
        }
        default:
          return [-1, null]
      }
    }

    if (count < 3) {
      return [-1, null]
    }

    const state: ThematicBreakDataNodeMatchState = {
      type: ThematicBreakDataNodeType,
      opening: true,
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
  public parse(): ThematicBreakDataNode {
    const result: ThematicBreakDataNode = {
      type: ThematicBreakDataNodeType
    }
    return result
  }
}
