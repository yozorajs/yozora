import type { NodePoint } from '@yozora/character'
import type { YastMeta, YastNode, YastNodeType } from '../node'
import type { YastToken } from '../token'

/**
 * Hooks on the parse phase.
 */
export interface TokenizerParseInlineHook<
  T extends YastNodeType = YastNodeType,
  Token extends YastToken<T> = YastToken<T>,
  Node extends YastNode = YastNode,
  Meta extends YastMeta = YastMeta
> {
  /**
   * Processing token list to YastNode list.
   * @param token
   * @param children
   * @param nodePoints      An array of NodePoint
   * @param meta            Meta of the Yast
   */
  processToken: (
    token: Token,
    children: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ) => Node
}
