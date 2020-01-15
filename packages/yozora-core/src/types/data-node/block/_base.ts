import { DataNode, DataNodeCategory } from '../_base'


/**
 * 块数据的类型
 */
export enum BlockDataNodeType {
  /**
   * 段落块数据
   */
  PARAGRAPH = 'paragraph'
}


/**
 * 块数据节点
 */
export interface BlockDataNode<T extends BlockDataNodeType = BlockDataNodeType, E = any>
  extends DataNode<DataNodeCategory.BLOCK, E> {
  /**
   * 块数据的类型
   * type of BlockDataNode
   */
  type: T
}
