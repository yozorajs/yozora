import type { IYastNode, YastNodeType } from '@yozora/ast'
import type { IPartialYastBlockToken } from '../token'
import type { IParseBlockPhaseApi } from './api'

export type IParseBlockHookCreator<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
> = (api: IParseBlockPhaseApi) => IParseBlockHook<T, IToken, INode>

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
   * @param api
   */
  parseBlock(
    token: Readonly<IToken>,
    children: IYastNode[],
    api: Readonly<IParseBlockPhaseApi>,
  ): IResultOfParse<T, INode>
}

export type IResultOfParse<
  T extends YastNodeType = YastNodeType,
  Node extends IYastNode<T> = IYastNode<T>,
> = Node | null
