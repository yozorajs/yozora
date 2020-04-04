/**
 * 源文档中的位置坐标
 * one place in a source file.
 * @see https://github.com/syntax-tree/unist#point
 */
export interface DataNodePoint {
  /**
   * 行号
   * a line in a source file
   * @minimum 1
   */
  line: number
  /**
   * 列号
   * a column in a source file
   * @minimum 1
   */
  column: number
  /**
   * 偏移量（从 0 开始计数）
   * a character in a source file
   * @minimum 0
   */
  offset: number
}


/**
 * 数据节点在源文档中的位置
 * the location of a node in a source file.
 * @see https://github.com/syntax-tree/unist#position
 */
export interface DataNodePosition {
  /**
   * the place of the first character of the parsed source region
   */
  start: DataNodePoint
  /**
   * the place of the first character after the parsed source region
   */
  end: DataNodePoint
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
  title?: string
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
 * 拥有子节点的数据节点
 * Parent represents a node in mdast containing other nodes (said to be children).
 * @see https://github.com/syntax-tree/mdast#association
 */
export interface DataNodeParent {
  /**
   * 子节点列表
   */
  children: DataNode[]
}


/**
 * 数据节点的类型
 */
export type DataNodeType = string


/**
 * 数据节点的数据
 */
export interface DataNodeData {

}


/**
 * 数据节点
 */
export interface DataNode<
  T extends DataNodeType = DataNodeType,
  D extends DataNodeData = DataNodeData> {
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
