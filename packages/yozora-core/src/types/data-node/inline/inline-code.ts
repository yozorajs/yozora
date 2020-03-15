import { InlineDataNodeType } from '../category'
import { InlineDataNode } from '../_base'


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
 *        { type: 'inline-code', value: 'alpha' }
 *        { type: 'text', value: ' ' },
 *        { type: 'inline-code', value: '`beta`' }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 */
export type InlineCodeDataNode = InlineDataNode<
  InlineDataNodeType.INLINE_CODE, InlineCodeDataNodeData>
