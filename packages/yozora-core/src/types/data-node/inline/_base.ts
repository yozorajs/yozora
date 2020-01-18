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
   * 行内代码块
   * inlineCode (mdast) / code span (gfm)
   */
  INLINE_CODE = 'inline-code',
  /**
   * 换行符
   * line break
   */
  LINE_BREAK = 'line-break',
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
