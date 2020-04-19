import {
  BaseBlockDataNodeTokenizer,
  BlockDataNodeEatingLineInfo,
  BlockDataNodeEatingResult,
  BlockDataNodeMatchResult,
  BlockDataNodeMatchState,
  BlockDataNodeTokenizer,
  CodePoint,
  DataNodeTokenPointDetail,
  isUnicodeWhiteSpace,
} from '@yozora/tokenizer-core'
import {
  ThematicBreakDataNode,
  ThematicBreakDataNodeData,
  ThematicBreakDataNodeType,
} from './types'


type T = ThematicBreakDataNodeType


export interface ThematicBreakDataNodeMatchState extends BlockDataNodeMatchState<T> {

}


export interface ThematicBreakDataNodeMatchResult extends BlockDataNodeMatchResult<T> {

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
    eatingLineInfo: BlockDataNodeEatingLineInfo,
    parentState: BlockDataNodeMatchState,
  ): BlockDataNodeEatingResult<T, ThematicBreakDataNodeMatchState> | null {
    if (eatingLineInfo.isBlankLine) return null
    const { endIndex, firstNonWhiteSpaceIndex } = eatingLineInfo
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
          return null
      }
    }

    if (count < 3) {
      return null
    }

    const state: ThematicBreakDataNodeMatchState = {
      type: ThematicBreakDataNodeType,
      opening: true,
      parent: parentState,
    }
    return { nextIndex: endIndex, state }
  }

  /**
   * override
   */
  public eatContinuationText(): null {
    return null
  }

  /**
   * override
   */
  public match(
    state: ThematicBreakDataNodeMatchState,
    children: BlockDataNodeMatchResult[],
  ): ThematicBreakDataNodeMatchResult {
    return {
      type: state.type,
      children,
    }
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
