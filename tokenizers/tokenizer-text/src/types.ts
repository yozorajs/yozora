import { DataNode } from '@yozora/tokenizer-core'


/**
 * typeof TextDataNode
 */
export const TextDataType = 'TEXT'
export type TextDataType = typeof TextDataType


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
 *    { type: 'TEXT', value: 'Alpha bravo charlie.' }
 *    ```
 * @see https://github.com/syntax-tree/mdast#text
 */
export type TextDataNode = DataNode<TextDataType, TextDataNodeData>
