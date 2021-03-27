import type { YastNode, YastNodeType } from '@yozora/ast'
import type { PartialYastBlockToken } from '../token'

/**
 * Hooks in the parse-block phase
 */
export interface TokenizerParseBlockHook<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastBlockToken<T> = PartialYastBlockToken<T>,
  Node extends YastNode<T> = YastNode<T>
> {
  /**
   * Parse matchStates
   * @param nodePoints  array of NodePoint
   * @param token       token on post-match phase
   */
  parseBlock(
    token: Readonly<Token>,
    children?: YastNode[],
  ): ResultOfParse<T, Node>
}

/**
 * # Returned on success
 *    => {
 *      classification: 'flow' | 'meta'
 *      token: Node
 *    }
 *
 *  * classification: classify YastNode
 *    - *flow*: Represents this YastNode is in the Document-Flow
 *    - *meta*: Represents this YastNode is a meta data node
 *  * token: the parsed data node
 *
 * # Returned on failure
 *    => null
 */
export type ResultOfParse<
  T extends YastNodeType = YastNodeType,
  Node extends YastNode<T> = YastNode<T>
> = {
  classification: 'flow' | 'meta' | 'flowAndMeta'
  node: Node
} | null
