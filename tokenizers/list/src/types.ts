import type { ListItem, ListItemState } from '@yozora/tokenizer-list-item'
import type { YastNode, YastParent } from '@yozora/tokenizercore'
import type { YastBlockState } from '@yozora/tokenizercore-block'


/**
 * typeof List
 */
export const ListType = 'list'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListType = typeof ListType


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
 *      type: 'list',
 *      listType: 'ordered',
 *      start: 1,
 *      marker: '.',
 *      spread: false,
 *      children: [{
 *        type: 'listBulletItem',
 *        children: [{
 *          type: 'paragraph',
 *          children: [{ type: 'text', value: 'foo' }]
 *        }]
 *      }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export interface List extends YastNode<ListType>, YastParent {
  /**
  * List type.
  */
  listType: 'bullet' | 'ordered' | string
  /**
   * The starting number of a ordered list-item.
   */
  start?: number
  /**
   * Marker of a bullet list-item, or delimiter of an ordered list-item.
   */
  marker: number
  /**
   * Whether if the list is loose.
   * @see https://github.github.com/gfm/#loose
   */
  spread: boolean
  /**
   * Lists are container block.
   */
  children: ListItem[]
}


/**
 * Middle state during the whole match and parse phase.
 */
export interface ListState extends YastBlockState<ListType> {
  /**
   * List type.
   */
  listType: string
  /**
   * The starting number of a ordered list-item.
   */
  start?: number
  /**
   * Marker of a bullet list-item, or delimiter of an ordered list-item.
   */
  marker: number
  /**
   * Whether if the list is loose.
   */
  spread: boolean
  /**
   * List items.
   */
  children: ListItemState[]
}
