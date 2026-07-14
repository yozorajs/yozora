import type { Node, NodeType } from '@yozora/ast'
import type { IPartialBlockToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IParseBlockPhaseApi } from './api'

/**
 * Context owned by the core parser for a single parse-block hook call.
 *
 * Child tokens are resolved before their parent tokens. Errors thrown by a
 * tokenizer propagate to the parser and abort the current parse.
 */
export interface IParseBlockPhaseContext {
  /**
   * Get the already parsed child nodes of the given direct token.
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
   * @param ctx         context containing their pre-parsed child nodes
   */
  parse(tokens: readonly IToken[], ctx: IParseBlockPhaseContext): INode[]
}
