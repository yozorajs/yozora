import { TextDataNode } from './inline/text'


/**
 * 数据节点的分类
 * category of DataNode
 */
export enum DataNodeCategory {
  /**
   * 块类型
   */
  BLOCK = 'block',
  /**
   * 内联类型
   */
  INLINE = 'inline'
}


/**
 * 数据节点
 */
export interface DataNode<C extends DataNodeCategory = DataNodeCategory, E = any> {
  /**
   * 数据节点所属的分类
   * category of DataNode
   */
  category: C
  /**
   * type of DataNode
   * 数据节点的具体类型
   */
  type: string
  /**
   * Other properties, used by specific renderers when rendering
   * 其它属性，用于具体的渲染器渲染时使用
   */
  extra?: E
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
 * @see https://github.com/syntax-tree/mdast#static-phrasing-content
 */
export type DataNodeStaticPhrasingContent =
  | TextDataNode


/**
 * 行内内容
 * Phrasing content represent the text in a document, and its markup.
 * @see https://github.com/syntax-tree/mdast#phrasing-content
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
