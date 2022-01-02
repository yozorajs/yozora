import type { IYastNode, YastNodeType } from '@yozora/ast'
import type { IPartialYastInlineToken } from '../token'
import type { IParseInlinePhaseApi } from './api'

export type IParseInlineHookCreator<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
> = (getApi: () => IParseInlinePhaseApi) => IParseInlineHook<T, IToken, INode>

/**
 * Hooks on the parse-inline phase.
 */
export interface IParseInlineHook<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  INode extends IYastNode<T> = IYastNode<T>,
> {
  /**
   * Processing token list to IYastNode list.
   * @param token
   * @param children
   * @param api
   */
  parseInline(token: IToken, children: IYastNode[], api: Readonly<IParseInlinePhaseApi>): INode
}
