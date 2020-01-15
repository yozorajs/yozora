import { InlineDataNode, InlineDataNodeType } from './_base'


/**
 * 行内文本
 * Text represents everything that is just text.
 *
 * @example
 *    ````markdown
 *    Alpha bravo charlie.
 *    ````
 *    ===>
 *    ```js
 *    { type: 'text', value: 'Alpha bravo charlie.' }
 *    ```
 * @see https://github.com/syntax-tree/mdast#text
 */
export interface TextDataNode extends InlineDataNode<InlineDataNodeType.TEXT> {
  /**
   * 文本内容
   * content of TextDataNode
   */
  value: string
}
