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
   */
  listType: ListType
  /**
   *
   */
  indent: number
  /**
   *
   */
  marker: number
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
 */
export type ListItemDataNode = BlockDataNode<ListItemDataNodeType, ListItemDataNodeData>
