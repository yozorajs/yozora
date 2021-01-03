import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListOrderedItem
 */
export const ListOrderedItemType = 'LIST_ITEM'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListOrderedItemType = typeof ListOrderedItemType


export type ListType = 'ordered'


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
export interface ListOrderedItem extends
  YastBlockNode<ListOrderedItemType>,
  BlockTokenizerParsePhaseState<ListOrderedItemType> {
  /**
   * 列表类型
   * List type
   */
  listType: ListType
  /**
   * 标记或分隔符
   * Marker of bullet list-ordered-item, and delimiter of ordered list-ordered-item
   */
  marker: number
  /**
   * 列表序号
   * Serial number of ordered list-ordered-item
   */
  order: number
  /**
   * ListOrderedItems are container block
   */
  children: BlockTokenizerParsePhaseState[]
}


/**
 * State of pre-match phase of ListOrderedItemTokenizer
 */
export interface ListOrderedItemPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<ListOrderedItemType> {
  /**
   * 列表类型
   * List type
   */
  listType: ListType
  /**
   * 标记或分隔符
   * Marker of bullet list-ordered-item, and delimiter of ordered list-ordered-item
   */
  marker: number
  /**
   * 列表序号
   * Serial number of ordered list-ordered-item
   */
  order: number
  /**
   * 缩进
   * Indent of list-ordered-item
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
  topBlankLineCount: number
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
  /**
   * 空行前最后一个子结点为关闭状态时，最少的子节点数量
   * The minimum number of child nodes when the last child before the blank line is closed
   */
  minNumberOfChildBeforeBlankLine: number
  /**
   * List of child nodes of current data node
   */
  children: BlockTokenizerPreMatchPhaseState[]
}


/**
 * State of match phase of ListOrderedItemTokenizer
 */
export interface ListOrderedItemMatchPhaseState
  extends BlockTokenizerMatchPhaseState<ListOrderedItemType> {
  /**
   * 列表类型
   * List type
   */
  listType: ListType
  /**
   * 标记或分隔符
   * Marker of bullet list-ordered-item, and delimiter of ordered list-ordered-item
   */
  marker: number
  /**
   * 列表序号
   * Serial number of ordered list-ordered-item
   */
  order: number
  /**
   * 缩进
   * Indent of list-ordered-item
   */
  indent: number
  /**
   * Whether exists blank line in the list-ordered-item
   */
  spread: boolean
  /**
   * 最后一行是否为空行
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}
