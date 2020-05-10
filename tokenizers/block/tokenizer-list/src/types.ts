import { BlockDataNode } from '@yozora/block-tokenizer-core'
import { DataNodeData } from '@yozora/tokenizer-core'


/**
 * typeof ListDataNode
 */
export const ListDataNodeType = 'LIST'
export type ListDataNodeType = typeof ListDataNodeType


/**
 * data of ListDataNode
 */
export interface ListDataNodeData extends DataNodeData {
  /**
   * 列表类型
   * list type
   */
  listType: 'bullet' | 'ordered' | string
  /**
   * 列表标记或分隔符
   * marker of bullet list-item, and delimiter of ordered list-item
   */
  marker: number
  /**
   * whether exists blank line in the list-item
   */
  spread: boolean
}


/**
 * 列表
 * List (Parent) represents a list of items.
 *
 * @example
 *    ````markdown
 *    1. foo
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'LIST',
 *      start: 1,
 *      listType: 'ordered',
 *      delimiter: '.',
 *      spread: false,
 *      children: [{
 *        type: 'LIST_ITEM',
 *        spread: false,
 *        children: [{
 *          type: 'PARAGRAPH',
 *          children: [{ type: 'TEXT', value: 'foo' }]
 *        }]
 *      }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export type ListDataNode = BlockDataNode<ListDataNodeType, ListDataNodeData>
