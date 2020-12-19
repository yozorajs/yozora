import type {
  DataNode,
  DataNodeData,
  DataNodeType,
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
 * Matchable range of rows to be processed
 */
export interface EatingLineInfo {
  /**
   * Line no of current line
   */
  lineNo: number
  /**
   * The starting index of the rest of the current line
   */
  startIndex: number
  /**
   * The ending index of the rest of the current line
   */
  endIndex: number
  /**
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhiteSpaceIndex: number
  /**
   * Whether the remaining content of the current line is blank
   */
  isBlankLine: boolean
}
