import { InlineDataNode, InlineDataNodeType } from './_base'


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
export interface InlineCodeDataNode extends InlineDataNode<InlineDataNodeType.INLINE_CODE> {
  /**
   * 代码内容
   */
  value: string
}
