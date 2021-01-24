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
export interface List extends YastBlockNode<ListType> {
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
}


/**
 * Original State of post-match phase of ListTaskItemTokenizer
 */
export interface ListItemPostMatchPhaseState extends BlockTokenizerPostMatchPhaseState {
  /**
   * Type of the list.
   */
  listType: string
  /**
   * Serial number of ordered list-ordered-item.
   */
  order?: number
  /**
   * Marker of bullet list-task-item, or a delimiter of ordered list-task-item
   */
  marker: number
}
