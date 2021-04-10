import type { YastNode, YastNodeType } from '@yozora/ast'
import type {
  PhrasingContent,
  PhrasingContentLine,
} from '@yozora/core-tokenizer'
import type { PartialYastBlockToken, YastBlockToken } from '../token'

/**
 * Api in parse-block phase.
 */
export interface ParseBlockPhaseApi {
  /**
   * Build PhrasingContent from a PhrasingContentToken.
   * @param lines
   */
  buildPhrasingContent(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContent | null
  /**
   * Parse phrasing content to Yozora AST nodes.
   * @param phrasingContent
   */
  parsePhrasingContent(phrasingContent: PhrasingContent): YastNode[]
  /**
   * Parse block tokens to Yozora AST nodes.
   * @param token
   */
  parseBlockTokens(token: YastBlockToken[]): YastNode[]
}

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
   * @param api
   */
  parseBlock(
    token: Readonly<Token>,
    children: YastNode[] | undefined,
    api: Readonly<ParseBlockPhaseApi>,
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
> = Node | null
