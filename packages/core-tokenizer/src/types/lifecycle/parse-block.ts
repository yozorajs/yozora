import type { IYastNode, YastNodeType } from '@yozora/ast'
import type { IPhrasingContent, IPhrasingContentLine } from '../phrasing-content'
import type { IPartialYastBlockToken, IYastBlockToken } from '../token'

/**
 * Api in parse-block phase.
 */
export interface IParseBlockPhaseApi {
  /**
   * Build IPhrasingContent from a PhrasingContentToken.
   * @param lines
   */
  buildPhrasingContent(lines: ReadonlyArray<IPhrasingContentLine>): IPhrasingContent | null
  /**
   * Parse phrasing content to Yozora AST nodes.
   * @param phrasingContent
   */
  parsePhrasingContent(phrasingContent: IPhrasingContent): IYastNode[]
  /**
   * Parse block tokens to Yozora AST nodes.
   * @param token
   */
  parseBlockTokens(token: IYastBlockToken[]): IYastNode[]
}

/**
 * Hooks in the parse-block phase
 */
export interface ITokenizerParseBlockHook<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
  Node extends IYastNode<T> = IYastNode<T>,
> {
  /**
   * Parse matchStates
   * @param nodePoints  array of INodePoint
   * @param token       token on post-match phase
   * @param api
   */
  parseBlock(
    token: Readonly<IToken>,
    children: IYastNode[],
    api: Readonly<IParseBlockPhaseApi>,
  ): IResultOfParse<T, Node>
}

/**
 * # Returned on success
 *    => {
 *      classification: 'flow' | 'meta'
 *      token: Node
 *    }
 *
 *  * classification: classify IYastNode
 *    - *flow*: Represents this IYastNode is in the Document-Flow
 *    - *meta*: Represents this IYastNode is a meta data node
 *  * token: the parsed data node
 *
 * # Returned on failure
 *    => null
 */
export type IResultOfParse<
  T extends YastNodeType = YastNodeType,
  Node extends IYastNode<T> = IYastNode<T>,
> = Node | null
