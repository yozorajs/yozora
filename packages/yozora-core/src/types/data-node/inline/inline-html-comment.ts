import { DataNodeParent } from '../_base'
import { InlineDataNode, InlineDataNodeType } from './_base'


/**
 * An HTML comment consists of '<!--' + text + '-->',
 * where text does not start with '>' or '->', does not end with '-', and does not contain '--'.
 *
 * https://github.github.com/gfm/#html-comment
 */
export interface InlineHTMLCommentDataNode
  extends InlineDataNode<InlineDataNodeType.INLINE_HTML_COMMENT>, DataNodeParent {
  /**
   * html 注释内容
   * content of InlineHTMLCommentDataNode
   */
  value: string
}
