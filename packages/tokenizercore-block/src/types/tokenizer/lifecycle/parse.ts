import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type { YastBlockNode, YastBlockNodeType } from '../../node'
import type { BlockTokenizerPostMatchPhaseState } from './post-match'


/**
 * Hooks in the parse phase
 */
export interface BlockTokenizerParsePhaseHook<
  T extends YastBlockNodeType = YastBlockNodeType,
  PMS extends BlockTokenizerPostMatchPhaseState<T> = BlockTokenizerPostMatchPhaseState<T>,
  PS extends BlockTokenizerParsePhaseState<T> = BlockTokenizerParsePhaseState<T>,
  MetaData extends unknown = unknown
  > {
  /**
   * Parse matchStates
   * @param nodePoints  array of EnhancedYastNodePoint
   * @param state       state on post-match phase
   * @param children    parsed child nodes
   */
  parse: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    state: Readonly<PMS>,
    children?: BlockTokenizerParsePhaseState[],
  ) => ResultOfParse<T, PS>

  /**
   * Parse meta nodes
   * @param nodePoints  array of EnhancedYastNodePoint
   * @param state       state on post-match phase
   */
  parseMeta?: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    states: ReadonlyArray<PS>,
  ) => MetaData
}


/**
 * State on parse phase
 */
export interface BlockTokenizerParsePhaseState<T extends YastBlockNodeType = YastBlockNodeType>
  extends YastBlockNode<T> {
  /**
   * List of child nodes of current data node
   */
  children?: BlockTokenizerParsePhaseState[]
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
  T extends YastBlockNodeType = YastBlockNodeType,
  PS extends BlockTokenizerParsePhaseState<T> = BlockTokenizerParsePhaseState<T>> =
  | { classification: 'flow' | 'meta', state: PS }
  | null
