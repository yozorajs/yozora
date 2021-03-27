import type { RootMeta, YastNode, YastNodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type { YastInlineToken } from '../token'

/**
 * Hooks on the parse-inline phase.
 */
export interface TokenizerParseInlineHook<
  T extends YastNodeType = YastNodeType,
  Token extends YastInlineToken<T> = YastInlineToken<T>,
  Node extends YastNode<T> = YastNode<T>,
  Meta extends RootMeta = RootMeta
> {
  /**
   * Processing token list to YastNode list.
   * @param token
   * @param children
   * @param nodePoints      An array of NodePoint
   * @param meta            Meta of the Yast
   */
  processToken(
    token: Token,
    children: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): Node
}
