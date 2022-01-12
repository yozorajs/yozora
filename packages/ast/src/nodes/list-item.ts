import type { Parent } from '../ast'

export const ListItemType = 'listItem'
export type ListItemType = typeof ListItemType

/**
 * Status of a task list item.
 * @see https://github.github.com/gfm/#task-list-items-extension-
 */
export enum TaskStatus {
  /**
   * To do, not yet started.
   */
  TODO = 'todo',
  /**
   * In progress.
   */
  DOING = 'doing',
  /**
   * Completed.
   */
  DONE = 'done',
}

/**
 * ListItem represents an item in a List.
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 */
export interface ListItem extends Parent<ListItemType> {
  /**
   * Status of a todo task.
   */
  status?: TaskStatus
}

/**
 * Example:
 *
 *    ````markdown
 *    * bar
 *
 *    1. foo
 *    ````
 *
 * Yields
 *
 *    ```json
 *    [
 *      {
 *        "type": "list",
 *        "ordered": false,
 *        "marker": 42,
 *        "spread": false,
 *        "children": [
 *          {
 *            "type": "listItem",
 *            "children": [
 *              {
 *                "type": "text",
 *                "value": "bar"
 *              }
 *            ]
 *          }
 *        ]
 *      },
 *      {
 *        "type": "list",
 *        "ordered": true,
 *        "orderType": "1",
 *        "start": 1,
 *        "marker": 46,
 *        "spread": false,
 *        "children": [
 *          {
 *            "type": "listItem",
 *            "children": [
 *              {
 *                "type": "text",
 *                "value": "foo"
 *              }
 *            ]
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 */
