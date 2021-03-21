import type { YastNode, YastNodeType } from '@yozora/ast'
import type { YastBlockState } from './match-block'

/**
 * Hooks in the parse-block phase
 */
export interface TokenizerParseBlockHook<
  T extends YastNodeType = YastNodeType,
  State extends YastBlockState<T> = YastBlockState<T>,
  Node extends YastNode = YastNode
> {
  /**
   * Parse matchStates
   * @param nodePoints  array of NodePoint
   * @param state       state on post-match phase
   */
  parseBlock(state: Readonly<State>, children?: YastNode[]): ResultOfParse<Node>
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
export type ResultOfParse<Node extends YastNode = YastNode> = {
  classification: 'flow' | 'meta' | 'flowAndMeta'
  node: Node
} | null
