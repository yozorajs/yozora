import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import { BaseBlockTokenizer } from '../tokenizer'
import {
  BlockTokenizer,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerPreParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerMatchPhaseHook,
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
    const result: PhrasingContentTokenizerMatchPhaseState = {
      type: preMatchPhaseState.type,
      classify: 'flow',
      contents: preMatchPhaseState.contents,
    }
    return result
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
      data: {
        contents: [],
      }
    }
    if (self.parseInlineData != null) {
      const innerData = self.parseInlineData(
        matchPhaseState.contents, 0, matchPhaseState.contents.length, preParsePhaseState.meta)
      result.data!.contents = innerData
    }
    return result
  }
}
