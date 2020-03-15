/**
 * 块数据的类型
 */
export enum BlockDataNodeType {
  /**
   * 段落块数据
   */
  PARAGRAPH = 'paragraph',
}


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
   * 粗体的行内文本
   */
  STRONG = 'strong',
  /**
   * 行内文本
   * inline text
   */
  TEXT = 'text',
}


/**
 * 数据节点的类型
 */
export type DataNodeType =
  | InlineDataNodeType
  | BlockDataNodeType


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
  INLINE = 'inline',
}
