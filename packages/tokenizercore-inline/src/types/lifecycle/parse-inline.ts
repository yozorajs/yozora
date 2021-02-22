import type { NodePoint } from '@yozora/character'
import type { YastMeta, YastNode, YastNodeType } from '@yozora/tokenizercore'
import type { YastToken } from './match-inline'


/**
 * Hooks on the parse phase.
 */
export interface TokenizerParseInlineHook<
  T extends YastNodeType = YastNodeType,
  Meta extends YastMeta = YastMeta,
  Token extends YastToken<T> = YastToken<T>,
  Node extends YastNode<T> = YastNode<T>,
  > {
  /**
   * Types of YastToken which this tokenizer could handle.
   */
  readonly recognizedTypes: YastNodeType[]

  /**
   * Processing token list to YastNode list.
   *
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
