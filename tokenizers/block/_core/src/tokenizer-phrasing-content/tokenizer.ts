import {
  DataNodeTokenPointDetail,
  calcTrimBoundaryOfCodePoints,
} from '@yozora/tokenizercore'
import { BaseBlockTokenizer } from '../tokenizer'
import {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreParsePhaseState,
} from '../types'
import { PhrasingContentDataNode, PhrasingContentDataNodeType } from './types'


type T = PhrasingContentDataNodeType


/**
 * State of match phase of PhrasingContentTokenizer
 */
export interface PhrasingContentTokenizerPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<T> {
  /**
   * Matched code positions
   */
  contents: DataNodeTokenPointDetail[]
}


/**
 * State of match phase of PhrasingContentTokenizer
 */
export interface PhrasingContentTokenizerMatchPhaseState
  extends BlockTokenizerMatchPhaseState<T> {
  /**
   * Matched code positions
   */
  contents: DataNodeTokenPointDetail[]
}


/**
 * Lexical Analyzer for PhrasingContentDataNode
 */
export class PhrasingContentTokenizer extends BaseBlockTokenizer<T>
  implements
    BlockTokenizer<T>,
    BlockTokenizerMatchPhaseHook<
      T,
      PhrasingContentTokenizerPreMatchPhaseState,
      PhrasingContentTokenizerMatchPhaseState>,
    BlockTokenizerParsePhaseHook<
      T,
      PhrasingContentTokenizerMatchPhaseState,
      PhrasingContentDataNode>
{
  public readonly name = 'PhrasingContentTokenizer'
  public readonly uniqueTypes: T[] = [PhrasingContentDataNodeType]

  /**
   * hook of @BlockTokenizerMatchPhaseHook
   */
  public match(
    preMatchPhaseState: PhrasingContentTokenizerPreMatchPhaseState
  ): PhrasingContentTokenizerMatchPhaseState {
    return calcToPhrasingContentMatchPhaseState(
      preMatchPhaseState.contents,
    )
  }

  /**
   * hook of @BlockTokenizerParsePhaseHook
   */
  public parseFlow(
    matchPhaseState: PhrasingContentTokenizerMatchPhaseState,
    preParsePhaseState: BlockTokenizerPreParsePhaseState,
  ): PhrasingContentDataNode {
    const self = this
    const result: PhrasingContentDataNode = {
      type: matchPhaseState.type,
      contents: [],
    }
    if (self.parseInlineData != null) {
      const innerData = self.parseInlineData(
        matchPhaseState.contents, 0, matchPhaseState.contents.length, preParsePhaseState.meta)
      result.contents = innerData
    }
    return result
  }
}


/**
 *
 * @param codePositions
 */
export function calcToPhrasingContentMatchPhaseState(
  codePositions: DataNodeTokenPointDetail[],
): PhrasingContentTokenizerMatchPhaseState {
  // Do trim
  let contents: DataNodeTokenPointDetail[] = codePositions
  const [leftIndex, rightIndex] = calcTrimBoundaryOfCodePoints(codePositions)
  if (rightIndex - leftIndex < contents.length) {
    contents = contents.slice(leftIndex, rightIndex)
  }

  return {
    type: PhrasingContentDataNodeType,
    classify: 'flow',
    contents,
  }
}
