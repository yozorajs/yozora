import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListOrderedItem
 */
export const ListOrderedItemType = 'LIST_ORDERED_ITEM'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListOrderedItemType = typeof ListOrderedItemType


export const OrderedListType = 'ordered'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type OrderedListType = typeof OrderedListType


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
export interface ListOrderedItem extends YastBlockNode<ListOrderedItemType> {
  /**
   * Type of the list
   */
  listType: OrderedListType
  /**
   * Marker of bullet list-task-item, or a delimiter of ordered list-task-item
   */
  marker: number
  /**
   * Serial number of ordered list-ordered-item
   */
  order: number
  /**
   * ListOrderedItems are container block
   */
  children: YastBlockNode[]
}


/**
 * State on match phase of ListOrderedItemTokenizer
 */
export type ListOrderedItemMatchPhaseState =
  & BlockTokenizerMatchPhaseState<ListOrderedItemType>
  & ListOrderedItemMatchPhaseStateData


/**
 * State on post-match phase of ListOrderedItemTokenizer
 */
export type ListOrderedItemPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<ListOrderedItemType>
  & ListOrderedItemMatchPhaseStateData


/**
 * State data on match phase of ListOrderedItemTokenizer
 */
export interface ListOrderedItemMatchPhaseStateData {
  /**
   * Type of the list
   */
  listType: OrderedListType
  /**
   * Marker of bullet list-task-item, or a delimiter of ordered list-task-item
   */
  marker: number
  /**
   * Serial number of ordered list-ordered-item
   */
  order: number
  /**
   * Indent of a ordered list item
   */
  indent: number
  /**
   * list-ordered-item 起始的空行数量
   * The number of blank lines at the beginning of a list-ordered-item
   */
  countOfTopBlankLine: number
}
