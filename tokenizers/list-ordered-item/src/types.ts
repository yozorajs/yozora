import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  BlockTokenizerParsePhaseState,
  ClosedBlockTokenizerMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListOrderedItem
 */
export const ListOrderedItemType = 'LIST_ITEM'
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
  children: BlockTokenizerParsePhaseState[]
}


/**
 * State on match phase of ListOrderedItemTokenizer
 */
export type ListOrderedItemMatchPhaseState =
  & BlockTokenizerMatchPhaseState
  & ListOrderedItemMatchPhaseStateData


/**
 * Closed state on match phase of ListOrderedItemTokenizer
 */
export type ClosedListOrderedItemMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & ListOrderedItemMatchPhaseStateData


/**
 * State data on match phase of ListOrderedItemTokenizer
 */
export interface ListOrderedItemMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<ListOrderedItemType> {
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
   * Whether exists blank line in the list-ordered-item
   */
  spread: boolean
  /**
   * list-ordered-item 起始的空行数量
   * The number of blank lines at the beginning of a list-ordered-item
   */
  countOfTopBlankLine: number
  /**
   * 上一行是否为空行
   * Whether the previous line is blank line or not
   */
  isPreviousLineBlank: boolean
  /**
   * 最后一行是否为空行
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}
