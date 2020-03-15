import { InlineDataNodeType } from '../category'
import { InlineDataNode } from '../_base'


/**
 * data of LineBreakDataNode
 */
export interface LineBreakDataNodeData {

}


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
export type LineBreakDataNode = InlineDataNode<
  InlineDataNodeType.LINE_BREAK, LineBreakDataNodeData>
