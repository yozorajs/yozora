import type { ListItem, ListItemState } from '@yozora/tokenizer-list-item'
import type {
  YastBlockState,
  YastNode,
  YastParent,
} from '@yozora/tokenizercore'

/**
 * typeof List
 */
export const ListType = 'list'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ListType = typeof ListType

/**
 * List (Parent) represents a list of items.
 *
 * @example
 *    ```json
 *    {
 *      "type": "list",
 *      "listType": "bullet",
 *      "marker": 45,
 *      "spread": false,
 *      "children": [
 *        {
 *          "type": "listItem",
 *          "marker": 45,
 *          "children": [
 *            {
 *              "type": "text",
 *              "value": "foo"
 *            }
 *          ]
 *        },
 *        {
 *          "type": "listItem",
 *          "marker": 45,
 *          "children": [
 *            {
 *              "type": "text",
 *              "value": "bar"
 *            }
 *          ]
 *        }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export interface List extends YastNode<ListType>, YastParent {
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
  children: ListItem[]
}

/**
 * Middle state during the whole match and parse phase.
 */
export interface ListState extends YastBlockState<ListType> {
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
  /**
   * List items.
   */
  children: ListItemState[]
}
