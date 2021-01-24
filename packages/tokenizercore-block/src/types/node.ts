import type {
  YastMeta,
  YastNode,
  YastNodeData,
  YastNodeType,
  YastRoot,
} from '@yozora/tokenizercore'


/**
 * The variant of a YastBlockNode.
 */
export type YastBlockNodeType = YastNodeType


/**
 * Data of a YastBlockNode.
 */
export interface YastBlockNodeData extends YastNodeData { }


/**
 * Block type YastNode.
 */
export interface YastBlockNode<
  T extends YastBlockNodeType = YastBlockNodeType,
  D extends YastBlockNodeData = YastBlockNodeData,
  > extends YastNode<T, D> { }


/**
 * Root node of YastBlockNode tree.
 */
export interface YastBlockRoot<M extends YastMeta = YastMeta> extends YastRoot {
  /**
   * Meta data.
   */
  meta: M
  /**
   * List representing the children of a node.
   */
  children: YastBlockNode[]
}
