import type {
  DataNode,
  DataNodeData,
  DataNodeTokenPointDetail,
  DataNodeType,
} from '@yozora/tokenizercore'


/**
 * 内联数据节点的类型
 * Type of InlineDataNode
 */
export type InlineDataNodeType = DataNodeType & string


/**
 * 内联数据节点的数据
 * Data of InlineDataNode
 */
export interface InlineDataNodeData extends DataNodeData {

}


/**
 * 内联数据节点 / 解析结果
 * InlineDataNode / InlineDataNodeParseResult
 */
export interface InlineDataNode<
  T extends InlineDataNodeType = InlineDataNodeType,
  D extends InlineDataNodeData = InlineDataNodeData,
  > extends DataNode<T, D> {

}


/**
 * Raw content need to handling
 */
export interface RawContent {
  /**
   * Code positions of content
   */
  codePositions: DataNodeTokenPointDetail[]
  /**
   * Meta data of content in the handling context
   */
  meta: Record<string, any>
}


/**
 * Content fragment
 */
export interface ContentFragment {
  /**
   * Start index of this content-fragment in codePositions
   */
  startIndex: number
  /**
   * End index of this content-fragment in codePositions
   */
  endIndex: number
}
