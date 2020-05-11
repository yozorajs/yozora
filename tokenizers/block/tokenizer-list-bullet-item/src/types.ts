import { BlockDataNode } from '@yozora/tokenizercore-block'


/**
 * typeof ListBulletItemDataNode
 */
export const ListBulletItemDataNodeType = 'LIST_BULLET_ITEM'
export type ListBulletItemDataNodeType = typeof ListBulletItemDataNodeType


export type ListType = 'bullet'


/**
 * data of ListBulletItemDataNode
 */
export interface ListBulletItemDataNodeData {
  /**
   * 列表类型
   * List type
   */
  listType: ListType
  /**
   * 标记或分隔符
   * Marker of bullet list-bullet-item, and delimiter of ordered list-bullet-item
   */
  marker: number
}


/**
 * 列表项
 * ListBulletItem (Parent) represents an item in a List.
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
export type ListBulletItemDataNode = BlockDataNode<ListBulletItemDataNodeType, ListBulletItemDataNodeData>
