import type { YastMeta, YastNode, YastRoot } from '@yozora/tokenizercore'


/**
 * Root node of YastNode tree.
 */
export interface YastBlockRoot<M extends YastMeta = YastMeta> extends YastRoot {
  /**
   * Meta data.
   */
  meta: M
  /**
   * List representing the children of a node.
   */
  children: YastNode[]
}
