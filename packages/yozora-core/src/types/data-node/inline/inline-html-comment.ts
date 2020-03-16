import { InlineDataNodeType } from '../category'
import { InlineDataNode } from '../_base'


/**
 * data of InlineHTMLCommentDataNode
 */
export interface InlineHTMLCommentDataNodeData {
  /**
   * html 注释内容
   * content of InlineHTMLCommentDataNode
   */
  value: string
}



/**
 * An HTML comment consists of '<!--' + text + '-->',
 * where text does not start with '>' or '->', does not end with '-', and does not contain '--'.
 *
 * https://github.github.com/gfm/#html-comment
 */
export type InlineHTMLCommentDataNode = InlineDataNode<
  InlineDataNodeType.INLINE_HTML_COMMENT, InlineHTMLCommentDataNodeData>
