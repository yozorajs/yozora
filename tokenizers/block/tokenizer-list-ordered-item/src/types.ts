import { BlockDataNode } from '@yozora/tokenizercore-block'


/**
 * typeof ListOrderedItemDataNode
 */
export const ListOrderedItemDataNodeType = 'LIST_ITEM'
export type ListOrderedItemDataNodeType = typeof ListOrderedItemDataNodeType


export type ListType = 'ordered'


/**
 * data of ListOrderedItemDataNode
 */
export interface ListOrderedItemDataNodeData {
  /**
   * 列表类型
   * List type
   */
  listType: ListType
  /**
   * 标记或分隔符
   * Marker of bullet list-ordered-item, and delimiter of ordered list-ordered-item
   */
  marker: number
  /**
   * 列表序号
   * Serial number of ordered list-ordered-item
   */
  order: number
}


/**
 * 列表项
 * ListOrderedItem (Parent) represents an item in a List.
 *
 * @example
 *    ````markdown
 *    ````
 *    ===>
 *    ```js
 *    ```
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-ordered-items
 */
export type ListOrderedItemDataNode = BlockDataNode<ListOrderedItemDataNodeType, ListOrderedItemDataNodeData>
