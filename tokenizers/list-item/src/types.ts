import type { YastNode } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListItem
 */
export const ListItemType = 'listItem'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListItemType = typeof ListItemType


export type ListType = 'bullet' | 'ordered'


/**
 * 列表项
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
export interface ListItem extends YastNode<ListItemType> {
  /**
   * Marker of bullet list-item, or a delimiter of ordered list-item.
   */
  marker: number
  /**
   * Serial number of ordered list-ordered-item.
   */
  order?: number
  /**
   * ListItems are container block.
   */
  children: YastNode[]
}


/**
 * State on match phase of ListItemTokenizer
 */
export type ListItemMatchPhaseState =
  & BlockTokenizerMatchPhaseState<ListItemType>
  & ListItemMatchPhaseStateData


/**
 * State on post-match phase of ListItemTokenizer
 */
export type ListItemPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<ListItemType>
  & ListItemMatchPhaseStateData


/**
 * State data on match phase of ListItemTokenizer
 */
export interface ListItemMatchPhaseStateData {
  /**
   * Type of the list.
   */
  listType: ListType
  /**
   * Marker of bullet list-item, or a delimiter of ordered list-item.
   */
  marker: number
  /**
   * Serial number of ordered list-item.
   */
  order?: number
  /**
   * Indent of a list item.
   */
  indent: number
  /**
   * list-item 起始的空行数量
   * The number of blank lines at the beginning of a list-item
   */
  countOfTopBlankLine: number
}
