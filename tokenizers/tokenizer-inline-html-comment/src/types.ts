import { DataNode } from '@yozora/tokenizer-core'


/**
 * typeof InlineHtmlCommentDataNode
 */
export const InlineHtmlCommentDataNodeType = 'INLINE_HTML_COMMENT'
export type InlineHtmlCommentDataNodeType = typeof InlineHtmlCommentDataNodeType


/**
 * data of InlineHtmlCommentDataNode
 */
export interface InlineHtmlCommentDataNodeData {
  /**
   * html 注释内容
   * content of InlineHTMLCommentDataNode
   */
  value: string
}


/**
 * 内联 html 注释
 * An HTML comment consists of '<!--' + text + '-->',
 * where text does not start with '>' or '->', does not end with '-', and does not contain '--'.
 *
 * @example
 *    ````markdown
 *    foo <!-- this is a
 *    comment - with hyphen -->
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'PARAGRAPH',
 *      children: [
 *        { type: 'TEXT', value: 'foo ' },
 *        { type: 'INLINE_HTML_COMMENT', value: ' this is a\ncomment - with hyphen ' }
 *      ]
 *    }
 *    ```
 * @see https://github.github.com/gfm/#html-comment
 */
export type InlineHtmlCommentDataNode = DataNode<InlineHtmlCommentDataNodeType, InlineHtmlCommentDataNodeData>
