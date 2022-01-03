import type { IYastNode, YastNodeType } from '@yozora/ast'
import type { IPartialYastBlockToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IParseBlockPhaseApi } from './api'

export type IParseBlockHookCreator<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
  IThis extends ITokenizer = ITokenizer,
> = (this: IThis, api: IParseBlockPhaseApi) => IParseBlockHook<T, IToken, INode>

/**
 * Hooks in the parse-block phase
 */
export interface IParseBlockHook<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
> {
  /**
   * Parse matchStates
   * @param nodePoints  array of INodePoint
   * @param token       token on post-match phase
   */
  parse(token: Readonly<IToken>, children: IYastNode[]): IResultOfParse<T, INode>
}

export type IResultOfParse<
  T extends YastNodeType = YastNodeType,
  Node extends IYastNode<T> = IYastNode<T>,
> = Node | null
