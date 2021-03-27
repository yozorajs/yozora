import type { YastParent } from '../ast'
import type { ListItem } from './list-item'

export const ListType = 'list'
export type ListType = typeof ListType

/**
 * List represents a list of items.
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export interface List extends YastParent<ListType> {
  /**
   * Whether it is an ordered lit.
   */
  ordered: boolean
  /**
   * The starting number of a ordered list-item.
   */
  start?: number
  /**
   * Marker of a unordered list-item, or delimiter of an ordered list-item.
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
 * Example:
 *
 *    ````markdown
 *    - foo
 *    - bar
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "list",
 *      "ordered": "true",
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
 */
