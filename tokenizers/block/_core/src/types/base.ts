import {
  DataNode,
  DataNodeData,
  DataNodeTokenPointDetail,
  DataNodeType,
  InlineDataNode,
} from '@yozora/tokenizercore'


/**
 * 块状数据节点的类型
 * Type of BlockDataNode
 */
export type BlockDataNodeType = DataNodeType & string


/**
 * 块状数据节点的数据
 * Data of BlockDataNode
 */
export interface BlockDataNodeData extends DataNodeData {

}


/**
 * 块状数据节点 / 解析结果
 * BlockDataNode / BlockDataNodeParseResult
 */
export interface BlockDataNode<
  T extends BlockDataNodeType = BlockDataNodeType,
  D extends BlockDataNodeData = BlockDataNodeData,
  > extends DataNode<T, D> {

}


/**
 * Metadata of block data node
 */
export type BlockDataNodeMetaData = Record<BlockDataNodeType, unknown>


/**
 * Parse InlineDataNode
 * @param codePositions
 * @param startIndex
 * @param endIndex
 * @param meta
 */
export type InlineDataNodeParseFunc<M> = (
  codePositions: DataNodeTokenPointDetail[],
  startIndex: number,
  endIndex: number,
  meta?: Record<BlockDataNodeType, M>,
) => InlineDataNode[]
