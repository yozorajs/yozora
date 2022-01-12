import type { Parent } from '../ast'

export const DeleteType = 'delete'
export type DeleteType = typeof DeleteType

/**
 * Delete represents contents that are no longer accurate or no longer relevant.
 * @see https://github.com/syntax-tree/mdast#delete
 * @see https://github.github.com/gfm/#strikethrough-extension-
 */
export type Delete = Parent<DeleteType>

/**
 * Example:
 *
 *    ````markdown
 *    ~~alpha~~
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    [
 *      {
 *        "type": "delete",
 *        "children": [
 *          { "type": "text", "value": "alpha" }
 *        ]
 *      }
 *    ]
 *    ```
 */
