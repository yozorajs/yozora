import type { NodePoint } from '@yozora/character'
import type { YastNode, YastNodeType } from '../node'
import type { YastBlockState } from './match-block'


/**
 * Hooks in the parse phase
 */
export interface TokenizerParseBlockHook<
  T extends YastNodeType = YastNodeType,
  State extends YastBlockState<T> = YastBlockState<T>,
  Node extends YastNode = YastNode,
  MetaData extends unknown = unknown
  > {
  /**
   * Parse matchStates
   * @param nodePoints  array of NodePoint
   * @param state       state on post-match phase
   * @param children    parsed child nodes
   */
  parse: (
    state: Readonly<State>,
    children: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
  ) => ResultOfParse<Node>

  /**
   * Parse meta nodes
   * @param nodePoints  array of NodePoint
   * @param state       state on post-match phase
   */
  parseMeta?: (
    states: ReadonlyArray<Node>,
    nodePoints: ReadonlyArray<NodePoint>,
  ) => MetaData
}


/**
 * # Returned on success
 *    => {
 *      classification: 'flow' | 'meta'
 *      state: Node
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
export type ResultOfParse<Node extends YastNode = YastNode> =
  | {
    classification: 'flow' | 'meta' | 'flowAndMeta',
    node: Node,
  }
  | null
