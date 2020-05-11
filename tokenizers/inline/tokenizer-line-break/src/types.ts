import { DataNode } from '@yozora/tokenizercore'


/**
 * typeof LineBreakDataNode
 */
export const LineBreakDataNodeType = 'LINE_BREAK'
export type LineBreakDataNodeType = typeof LineBreakDataNodeType


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
 *        { type: 'TEXT', value: 'foo' },
 *        { type: 'LINE_BREAK' },
 *        { type: 'TEXT', value: 'bar' }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#linebreak
 */
export type LineBreakDataNode = DataNode<LineBreakDataNodeType, LineBreakDataNodeData>
