import type {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof ListBulletItemDataNode
 */
export const ListBulletItemDataNodeType = 'LIST_BULLET_ITEM'
export type ListBulletItemDataNodeType = typeof ListBulletItemDataNodeType


export type ListType = 'bullet'


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
export interface ListBulletItemDataNode extends
  BlockDataNode<ListBulletItemDataNodeType>,
  BlockTokenizerParsePhaseState<ListBulletItemDataNodeType> {
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
  /**
   * ListBulletItems are container block
   */
  children: BlockTokenizerParsePhaseState[]
}


/**
 * State of pre-match phase of ListBulletItemTokenizer
 */
export interface ListBulletItemPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<ListBulletItemDataNodeType> {
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
  /**
   * 缩进
   * Indent of list-bullet-item
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
 * State of match phase of ListBulletItemTokenizer
 */
export interface ListBulletItemMatchPhaseState
  extends BlockTokenizerMatchPhaseState<ListBulletItemDataNodeType> {
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
  /**
   * 缩进
   * Indent of list-bullet-item
   */
  indent: number
  /**
   * Whether exists blank line in the list-bullet-item
   */
  spread: boolean
  /**
   * 最后一行是否为空行
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}
