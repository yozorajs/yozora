import { InlineDataNodeType } from '../category'
import { InlineDataNode } from '../_base'


/**
 * data of TextDataNode
 */
export interface TextDataNodeData {
  /**
   * 文本内容
   * content of TextDataNode
   */
  value: string
}


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
export type TextDataNode = InlineDataNode<
  InlineDataNodeType.TEXT, TextDataNodeData>
