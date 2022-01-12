import type { Node, NodeType } from '@yozora/ast'
import type { IPartialYastInlineToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IParseInlinePhaseApi } from './api'

export type IParseInlineHookCreator<
  T extends NodeType = NodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  INode extends Node<T> = Node<T>,
  IThis extends ITokenizer = ITokenizer,
> = (this: IThis, api: Readonly<IParseInlinePhaseApi>) => IParseInlineHook<T, IToken, INode>

/**
 * Hooks on the parse-inline phase.
 */
export interface IParseInlineHook<
  T extends NodeType = NodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  INode extends Node<T> = Node<T>,
> {
  /**
   * Processing token list to Node list.
   * @param token
   */
  parse(token: ReadonlyArray<IToken>): INode[]
}
