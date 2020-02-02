import { DataNode, DataNodeCategory } from '../_base'


/**
 * 内联数据的类型
 * types of InlineDataNode
 */
export enum InlineDataNodeType {
  /**
   * 删除线
   * Strike through
   */
  DELETE = 'delete',
  /**
   * 斜体的行内文本
   */
  EMPHASIS = 'emphasis',
  /**
   * 图片
   */
  IMAGE = 'image',
  /**
   * 行内代码块
   * inlineCode (mdast) / code span (gfm)
   */
  INLINE_CODE = 'inline-code',
  /**
   * 行内数学公式
   */
  INLINE_FORMULA = 'inline-formula',
  /**
   * 行内超链接
   */
  INLINE_LINK = 'inline-link',
  /**
   * 换行符
   * line break
   */
  LINE_BREAK = 'line-break',
  /**
   * raw html tags
   */
  INLINE_HTML_COMMENT = 'inline-html-comment',
  /**
   * 图片引用
   */
  REFERENCE_IMAGE = 'reference-image',
  /**
   * 引用式链接
   */
  REFERENCE_LINK = 'reference-link',
  /**
   * 行内文本
   * inline text
   */
  TEXT = 'text',
}


/**
 * 内联数据节点
 */
export interface InlineDataNode<T extends InlineDataNodeType = InlineDataNodeType, E = any>
  extends DataNode<DataNodeCategory.INLINE, E> {
  /**
   * 内联数据的类型
   * type of InlineDataNode
   */
  type: T
}
