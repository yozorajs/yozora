import { InlineDataNode } from '@yozora/tokenizer-core'


/**
 * typeof InlineCodeDataNode
 */
export const InlineCodeDataNodeType = 'INLINE_CODE'
export type InlineCodeDataNodeType = typeof InlineCodeDataNodeType


/**
 * data of InlineCodeDataNode
 */
export interface InlineCodeDataNodeData {
  /**
   * 代码内容
   */
  value: string
}


/**
 * 行内代码
 *
 * @example
 *    ````markdown
 *    `alpha` `\`beta\``
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'paragraph',
 *      children: [
 *        { type: 'INLINE_CODE', value: 'alpha' }
 *        { type: 'TEXT', value: ' ' },
 *        { type: 'INLINE_CODE', value: '`beta`' }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 */
export type InlineCodeDataNode = InlineDataNode<InlineCodeDataNodeType, InlineCodeDataNodeData>
