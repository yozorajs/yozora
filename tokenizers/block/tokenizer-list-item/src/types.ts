import { BlockDataNode } from '@yozora/block-tokenizer-core'


/**
 * typeof ListItemDataNode
 */
export const ListItemDataNodeType = 'LIST_ITEM'
export type ListItemDataNodeType = typeof ListItemDataNodeType


export type ListType = 'bullet' | 'ordered'


/**
 * data of ListItemDataNode
 */
export interface ListItemDataNodeData {
  /**
   * 列表类型
   * list type
   */
  listType: ListType
  /**
   * 缩进
   * indent of list-item
   */
  indent: number
  /**
   * 标记或分隔符
   * marker of bullet list-item, and delimiter of ordered list-item
   */
  marker: number
  /**
   * 列表序号
   * serial number of ordered list-item
   */
  order?: number
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
