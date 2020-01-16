import { InlineDataNode, InlineDataNodeType } from './_base'


/**
 * 换行
 * Break represents a line break, such as in poems or addresses.
 *
 * @example
 *    ````markdown
 *    foo··
 *    bar
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'paragraph',
 *      children: [
 *        { type: 'text', value: 'foo' },
 *        { type: 'line-break' },
 *        { type: 'text', value: 'bar' }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#linebreak
 */
export interface LineBreakDataNode extends InlineDataNode<InlineDataNodeType.LINE_BREAK> {
}
