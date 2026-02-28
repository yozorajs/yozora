import type { Node, NodeType } from '@yozora/ast'
import type { IPartialBlockToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IParseBlockPhaseApi } from './api'

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
   * @param token       token on match phase
   */
  parse(token: readonly IToken[]): INode[]
}
