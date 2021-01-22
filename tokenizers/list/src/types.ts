import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


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
 *      start: 1,
 *      listType: 'ordered',
 *      delimiter: '.',
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
 * State on match phase of ListTokenizer
 */
export type ListMatchPhaseState =
  & BlockTokenizerMatchPhaseState<ListType>
  & ListMatchPhaseStateData


/**
 * State on post-match phase of ListTokenizer
 */
export type ListPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<ListType>
  & ListMatchPhaseStateData
  & {
    /**
     * List items
     */
    children: ListItemPostMatchPhaseState[]
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
}
