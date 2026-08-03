import type { Node, NodeType } from '@yozora/ast'
import type { IPartialBlockToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IParseBlockPhaseApi } from './api'

/**
 * Context provided by the core parser during a parse-block hook call.
 *
 * The core parser resolves child tokens before their parent token. The context
 * is valid only for the current hook call, and tokenizer errors abort parsing.
 */
export interface IParseBlockPhaseContext {
  /**
   * Get the parsed child nodes of a token passed to the current hook.
   * @param token
   */
  getChildren(token: Readonly<IPartialBlockToken>): Node[]
}

export type IParseBlockHookCreator<
  T extends NodeType = NodeType,
  IToken extends IPartialBlockToken<T> = IPartialBlockToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> = (this: IThis, api: IParseBlockPhaseApi) => IParseBlockHook<T, IToken, INode>

/**
 * Hooks in the parse-block phase
 */
export interface IParseBlockHook<
  T extends NodeType = NodeType,
  IToken extends IPartialBlockToken<T> = IPartialBlockToken<T>,
  INode extends Node<T> = Node<T>,
> {
  /**
   * Processing token list to Node list.
   * @param tokens      tokens on match phase
   * @param ctx         context containing their parsed child nodes
   */
  parse(tokens: readonly IToken[], ctx: IParseBlockPhaseContext): INode[]
}
