import type { Definition, YastNode, YastNodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type { PartialYastInlineToken } from '../token'

/**
 * Api in parse-inline phase.
 */
export interface ParseInlinePhaseApi {
  /**
   * Get definition by identifier.
   * @param identifier
   */
  getDefinition(identifier: string): Omit<Definition, 'type'> | undefined
}

/**
 * Hooks on the parse-inline phase.
 */
export interface TokenizerParseInlineHook<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastInlineToken<T> = PartialYastInlineToken<T>,
  Node extends YastNode<T> = YastNode<T>
> {
  /**
   * Processing token list to YastNode list.
   * @param token
   * @param children
   * @param nodePoints
   * @param api
   */
  processToken(
    token: Token,
    children: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<ParseInlinePhaseApi>,
  ): Node
}
