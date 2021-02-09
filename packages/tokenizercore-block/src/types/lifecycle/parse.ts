import type { NodePoint } from '@yozora/character'
import type { YastNode, YastNodeType } from '@yozora/tokenizercore'
import type { BlockTokenizerPostMatchPhaseState } from './post-match'


/**
 * Hooks in the parse phase
 */
export interface BlockTokenizerParsePhaseHook<
  T extends YastNodeType = YastNodeType,
  PMS extends BlockTokenizerPostMatchPhaseState<T> = BlockTokenizerPostMatchPhaseState<T>,
  PS extends YastNode<T> = YastNode<T>,
  MetaData extends unknown = unknown
  > {
  /**
   * Types of InlineTokenizerMatchPhaseState which this tokenizer could handle.
   */
  readonly recognizedTypes: ReadonlyArray<YastNodeType>

  /**
   * Parse matchStates
   * @param nodePoints  array of NodePoint
   * @param state       state on post-match phase
   * @param children    parsed child nodes
   */
  parse: (
    nodePoints: ReadonlyArray<NodePoint>,
    state: Readonly<PMS>,
    children?: YastNode[],
  ) => ResultOfParse<T, PS>

  /**
   * Parse meta nodes
   * @param nodePoints  array of NodePoint
   * @param state       state on post-match phase
   */
  parseMeta?: (
    nodePoints: ReadonlyArray<NodePoint>,
    states: ReadonlyArray<PS>,
  ) => MetaData
}


/**
 * # Returned on success
 *    => {
 *      classification: 'flow' | 'meta'
 *      state: PS
 *    }
 *
 *  * classification: classify YastNode
 *    - *flow*: Represents this YastNode is in the Document-Flow
 *    - *meta*: Represents this YastNode is a meta data node
 *  * state: the parsed data node
 *
 * # Returned on failure
 *    => null
 */
export type ResultOfParse<
  T extends YastNodeType = YastNodeType,
  PS extends YastNode<T> = YastNode<T>> =
  | {
    classification: 'flow' | 'meta' | 'flowAndMeta',
    state: PS,
  }
  | null
