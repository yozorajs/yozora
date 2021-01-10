import type {
  BlockTokenizerPostMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof List
 */
export const ListType = 'LIST'
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
 *      type: 'LIST',
 *      start: 1,
 *      listType: 'ordered',
 *      delimiter: '.',
 *      spread: false,
 *      children: [{
 *        type: 'LIST_ITEM',
 *        spread: false,
 *        children: [{
 *          type: 'PARAGRAPH',
 *          children: [{ type: 'TEXT', value: 'foo' }]
 *        }]
 *      }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export interface List extends YastBlockNode<ListType> {
  /**
* 列表类型
* list type
*/
  listType: 'bullet' | 'ordered' | string
  /**
   * 列表标记或分隔符
   * marker of bullet list-item, and delimiter of ordered list-item
   */
  marker: number
  /**
   * whether exists blank line in the list-item
   */
  spread: boolean
  /**
   * Lists are container block
   */
  children: YastBlockNode[]
}


/**
 * State on post-match phase of ListTaskItemTokenizer
 */
export type ListPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<ListType>
  & ListMatchPhaseStateData
  & {
    /**
     * List items
     */
    children: ClosedListItemMatchPhaseState[]
  }


/**
 * State data on match phase of ListTokenizer
 */
export interface ListMatchPhaseStateData {
  /**
   * 列表类型
   * list type
   */
  listType: string
  /**
   * 列表标记或分隔符
   * marker of bullet list-item, and delimiter of ordered list-item
   */
  marker: number
  /**
   * whether exists blank line in the list-item
   */
  spread: boolean
}


/**
 * Original State of post-match phase of ListTaskItemTokenizer
 */
export interface ListItemPostMatchPhaseState extends BlockTokenizerPostMatchPhaseState {
  /**
   * Type of the list
   */
  listType: string
  /**
   * Marker of bullet list-task-item, or a delimiter of ordered list-task-item
   */
  marker: number
  /**
   * Whether exists blank line in the list-task-item
   */
  spread: boolean
  /**
   * Whether the last line is blank line or not
   */
  isLastLineBlank: boolean
}
