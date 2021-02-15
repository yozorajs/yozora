import type { YastNode, YastParent } from '@yozora/tokenizercore'
import type { YastBlockState } from '@yozora/tokenizercore-block'


/**
 * typeof ListItem
 */
export const ListItemType = 'listItem'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListItemType = typeof ListItemType


/**
 * Status of a task.
 */
export enum TaskStatus {
  /**
   * To do, not yet started.
   */
  TODO = 'todo',
  /**
   * In progress.
   */
  DOING = 'doing',
  /**
   * Completed.
   */
  DONE = 'done',
}


/**
 * ListItem (Parent) represents an item in a List.
 *
 * @example
 *    ````markdown
 *    * bar
 *
 *    1. foo
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'listItem',
 *      marker: 42,   // '*'
 *      children: [{
 *        type: 'paragraph',
 *        children: [{ type: 'text', value: 'bar' }]
 *      }]
 *    }
 *    {
 *      type: 'listItem',
 *      marker: 46,   // '.'
 *      order: 1
 *      children: [{
 *        type: 'paragraph',
 *        children: [{ type: 'text', value: 'bar' }]
 *      }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 */
export interface ListItem extends YastNode<ListItemType>, YastParent {
  /**
   * Marker of bullet list-item, or a delimiter of ordered list-item.
   */
  marker: number
  /**
   * Serial number of ordered list-ordered-item.
   */
  order?: number
  /**
   * Status of a todo task.
   */
  status?: TaskStatus
}


/**
 * Middle state during the whole match and parse phase.
 */
export interface ListItemState extends YastBlockState<ListItemType> {
  /**
   * Type of the list.
   */
  listType: 'bullet' | 'ordered'
  /**
   * Marker of bullet list-item, or a delimiter of ordered list-item.
   */
  marker: number
  /**
   * Serial number of ordered list-item.
   */
  order?: number
  /**
   * Status of a todo task.
   */
  status?: TaskStatus
  /**
   * Indent of a list item.
   */
  indent: number
  /**
   * list-item 起始的空行数量
   * The number of blank lines at the beginning of a list-item
   */
  countOfTopBlankLine: number
  /**
   * Child state nodes.
   */
  children: YastBlockState[]
}
