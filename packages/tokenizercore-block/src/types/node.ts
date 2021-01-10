import type {
  YastNode,
  YastNodeData,
  YastNodeType,
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
 * Meta data of YastBlockNode.
 */
export type YastBlockNodeMeta = Record<YastBlockNodeType, unknown>
