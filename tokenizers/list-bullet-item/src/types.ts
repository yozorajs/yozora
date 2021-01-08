import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  BlockTokenizerParsePhaseState,
  ClosedBlockTokenizerMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListBulletItem
 */
export const ListBulletItemType = 'LIST_BULLET_ITEM'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListBulletItemType = typeof ListBulletItemType


export const BulletListType = 'bullet'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type BulletListType = typeof BulletListType


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
export interface ListBulletItem extends YastBlockNode<ListBulletItemType> {
  /**
   * Type of the list
   */
  listType: BulletListType
  /**
   * Marker of bullet list-task-item, or a delimiter of ordered list-task-item
   */
  marker: number
  /**
   * ListBulletItems are container block
   */
  children: BlockTokenizerParsePhaseState[]
}


/**
 * State on match phase of ListBulletItemTokenizer
 */
export type ListBulletItemMatchPhaseState =
  & BlockTokenizerMatchPhaseState
  & ListBulletItemMatchPhaseStateData


/**
 * Closed state on match phase of ListBulletItemTokenizer
 */
export type ClosedListBulletItemMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & ListBulletItemMatchPhaseStateData


/**
 * State data on match phase of ListBulletItemTokenizer
 */
export interface ListBulletItemMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<ListBulletItemType> {
  /**
   * Type of the list
   */
  listType: BulletListType
  /**
   * Marker of bullet list-task-item, or a delimiter of ordered list-task-item
   */
  marker: number
  /**
   * Indent of a bullet list item
   */
  indent: number
  /**
   * Whether exists blank line in the list-bullet-item
   */
  spread: boolean
  /**
   * list-bullet-item 起始的空行数量
   * The number of blank lines at the beginning of a list-bullet-item
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
