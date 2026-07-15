import type { Node, NodeType } from '@yozora/ast'
import type { IPartialInlineToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IParseInlinePhaseApi } from './api'

/**
 * Context owned by the core parser for a single parse-inline hook call.
 *
 * Child tokens are resolved before their parent tokens. Errors thrown by a
 * tokenizer propagate to the parser and abort the current parse.
 */
export interface IParseInlinePhaseContext {
  /**
   * Get the already parsed child nodes of the given direct token.
   * @param token
   */
  getChildren(token: Readonly<IPartialInlineToken>): Node[]
}

export type IParseInlineHookCreator<
  T extends NodeType = NodeType,
  IToken extends IPartialInlineToken<T> = IPartialInlineToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> = (this: IThis, api: Readonly<IParseInlinePhaseApi>) => IParseInlineHook<T, IToken, INode>

/**
 * Hooks on the parse-inline phase.
 */
export interface IParseInlineHook<
  T extends NodeType = NodeType,
  IToken extends IPartialInlineToken<T> = IPartialInlineToken<T>,
  INode extends Node<T> = Node<T>,
> {
  /**
   * Processing token list to Node list.
   * @param tokens      tokens on match phase
   * @param ctx         context containing their pre-parsed child nodes
   */
  parse(tokens: readonly IToken[], ctx: IParseInlinePhaseContext): INode[]
}
