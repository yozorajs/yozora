import type { YastNode, YastNodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type { PartialYastInlineToken } from '../token'

/**
 * Api in parse-inline phase.
 */
export interface ParseInlinePhaseApi {
  /**
   * Get the node points.
   */
  getNodePoints(): ReadonlyArray<NodePoint>

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
export interface TokenizerParseInlineHook<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastInlineToken<T> = PartialYastInlineToken<T>,
  Node extends YastNode<T> = YastNode<T>,
> {
  /**
   * Processing token list to YastNode list.
   * @param token
   * @param children
   * @param api
   */
  parseInline(
    token: Token,
    children: YastNode[],
    api: Readonly<ParseInlinePhaseApi>,
  ): Node
}
