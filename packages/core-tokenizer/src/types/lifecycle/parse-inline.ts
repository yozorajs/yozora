import type { IYastNode, YastNodeType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type { IPartialYastInlineToken } from '../token'

/**
 * Api in parse-inline phase.
 */
export interface IParseInlinePhaseApi {
  /**
   * Get the node points.
   */
  getNodePoints(): ReadonlyArray<INodePoint>

  /**
   * Check if there is exists a definition with the given identifier.
   * @param identifier
   */
  hasDefinition(identifier: string): boolean

  /**
   * Check if there is exists a footnote definition with the given identifier.
   * @param identifier
   */
  hasFootnoteDefinition(identifier: string): boolean
}

/**
 * Hooks on the parse-inline phase.
 */
export interface ITokenizerParseInlineHook<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  Node extends IYastNode<T> = IYastNode<T>,
> {
  /**
   * Processing token list to IYastNode list.
   * @param token
   * @param children
   * @param api
   */
  parseInline(token: IToken, children: IYastNode[], api: Readonly<IParseInlinePhaseApi>): Node
}
