import type { Node, NodeType } from '@yozora/ast'
import type { IPartialBlockToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IParseBlockPhaseApi, IParseBlockTokensRequest } from './api'

/**
 * A parse-block generator suspended while the core parser resolves children.
 */
export type IParseBlockGenerator<TResult> = Generator<IParseBlockTokensRequest, TResult, Node[]>

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
   *
   * Return nodes synchronously when no child parsing is needed. To parse
   * children lazily without recursive call-stack growth, return a generator
   * and yield requests created by `api.requestBlockTokens(tokens)`.
   *
   * @param tokens tokens on match phase
   */
  parse(tokens: readonly IToken[]): INode[] | IParseBlockGenerator<INode[]>
}
