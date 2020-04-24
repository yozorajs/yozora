import { BlockDataNode, DataNode, DataNodeParent } from '@yozora/tokenizer-core'


/**
 * typeof ListDataNode
 */
export const ListDataNodeType = 'LIST'
export type ListDataNodeType = typeof ListDataNodeType


/**
 * child of list
 */
export interface ListDataNodeChild extends DataNode {
  /**
   * 列表类型
   * list type
   */
  listType: 'bullet' | 'ordered' | string
  /**
   * 列表标记符
   * marker of list-item
   */
  marker: number
  /**
   * 分隔符
   * delimiter of ordered list-item
   */
  delimiter: number
  /**
   * whether exists blank line in the list-item
   */
  spread: boolean
}


/**
 * data of ListDataNode
 */
export interface ListDataNodeData extends DataNodeParent<ListDataNodeChild> {
  /**
   * 列表类型
   * list type
   */
  listType: 'bullet' | 'ordered' | string
  /**
   * 列表标记符
   * marker of list-item
   */
  marker: number
  /**
   * 分隔符
   * delimiter of ordered list-item
   */
  delimiter: number
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
