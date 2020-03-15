import { DeleteDataNode } from './inline/delete'
import { LineBreakDataNode } from './inline/line-break'
import { TextDataNode } from './inline/text'
import { DataNodePosition } from './position'
import { DataNodeCategory, DataNodeType, InlineDataNodeType, BlockDataNodeType } from './category'


/**
 * 数据节点的数据
 */
export interface DataNodeData {

}


/**
 * 数据节点
 */
export interface DataNode<
  C extends DataNodeCategory = DataNodeCategory,
  T extends DataNodeType = DataNodeType,
  D extends DataNodeData = DataNodeData> {
  /**
   * 数据节点所属的分类
   * the category of DataNode
   */
  category: C
  /**
   * 数据节点的具体类型
   * the concrete type of a DataNode
   */
  type: T
  /**
   * 数据节点的位置信息
   * the location of a node in a source document
   */
  position: DataNodePosition
  /**
   * information from the ecosystem
   */
  data?: D
}


/**
 * 块数据节点
 */
export interface BlockDataNode<
  T extends BlockDataNodeType = BlockDataNodeType,
  D extends DataNodeData = DataNodeData>
  extends DataNode<DataNodeCategory.BLOCK, T, D> {
  /**
   * 块数据的类型
   * type of BlockDataNode
   */
  type: T
}


/**
 * 内联数据节点
 */
export interface InlineDataNode<
  T extends InlineDataNodeType = InlineDataNodeType,
  D extends DataNodeData = DataNodeData>
  extends DataNode<DataNodeCategory.INLINE, T, D> {
  /**
   * 内联数据的类型
   * type of InlineDataNode
   */
  type: T
}


/**
 * 拥有子节点的数据节点
 * Parent represents a node in mdast containing other nodes (said to be children).
 * @see https://github.com/syntax-tree/mdast#association
 */
export interface DataNodeParent {
  /**
   * 子节点列表
   */
  children: DataNodeContent[]
}


/**
 * 数据节点关联关系
 * Association represents an internal relation from one node to another.
 * @see https://github.com/syntax-tree/mdast#association
 */
export interface DataNodeAssociation {
  /**
   * 标识符（经过 toKebab 处理后的值）
   * It can match an identifier field on another node.
   */
  identifier: string
  /**
   * 标识符字段未经处理的值
   * Represents the original value of the normalized identifier field.
   */
  label: string
}


/**
 * 数据节点的可替代内容
 * Alternative represents a node with a fallback.
 * @see https://github.com/syntax-tree/mdast#alternative
 */
export interface DataNodeAlternative {
  /**
   * 替代内容
   * Represents equivalent content for environments that cannot represent the node as intended.
   */
  alt: string
}


/**
 * 数据节点的资源描述信息
 * Resource represents a reference to resource.
 * @see https://github.com/syntax-tree/mdast#resource
 */
export interface DataNodeResource {
  /**
   * 被引用的资源的 url
   * Represents a URL to the referenced resource.
   */
  url: string
  /**
   * 资源的简要描述信息
   * Represents advisory information for the resource, such as would be appropriate for a tooltip.
   */
  title: string
}


/**
 * 静态类型的行内内容
 * StaticPhrasing content represent the text in a document, and its markup, that is not intended for user interaction.
 * @see https://github.com/syntax-tree/mdast#staticphrasingcontent
 */
export type DataNodeStaticPhrasingContent =
  | TextDataNode
  | DeleteDataNode
  | LineBreakDataNode

/**
 * 行内内容
 * Phrasing content represent the text in a document, and its markup.
 * @see https://github.com/syntax-tree/mdast#phrasingcontent
 */
export type DataNodePhrasingContent =
  | DataNodeStaticPhrasingContent


/**
 * 数据节点的子节点元素类型
 * Each node in mdast falls into one or more categories
 * of Content that group nodes with similar characteristics together.
 * @see https://github.com/syntax-tree/mdast#content
 */
export type DataNodeContent =
  | DataNodePhrasingContent
