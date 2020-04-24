import { BlockDataNode, DataNodeParent } from '@yozora/tokenizer-core'


/**
 * typeof ListItemDataNode
 */
export const ListItemDataNodeType = 'LIST_ITEM'
export type ListItemDataNodeType = typeof ListItemDataNodeType


export type ListType = 'bullet' | 'ordered'


/**
 * data of ListItemDataNode
 */
export interface ListItemDataNodeData extends DataNodeParent {
  /**
   * 列表类型
   * list type
   */
  listType: ListType
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
   * 缩进
   * indent of list-item
   */
  indent: number
}


/**
 * 列表项
 * ListItem (Parent) represents an item in a List.
 *
 * @example
 *    ````markdown
 *    ````
 *    ===>
 *    ```js
 *    ```
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 */
export type ListItemDataNode = BlockDataNode<ListItemDataNodeType, ListItemDataNodeData>
