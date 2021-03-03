import type {
  YastNode,
  YastParent,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

/**
 * typeof Delete
 */
export const DeleteType = 'delete'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DeleteType = typeof DeleteType

/**
 * Delete represents contents that are no longer accurate or no longer relevant.
 *
 * @example
 *    ````markdown
 *    ~~alpha~~
 *    ````
 *    ===>
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
 * @see https://github.com/syntax-tree/mdast#delete
 * @see https://github.github.com/gfm/#strikethrough-extension-
 */
export interface Delete extends YastNode<DeleteType>, YastParent {}

/**
 * A `delete` token.
 */
export type DeleteToken = YastToken<DeleteType>

/**
 * Delimiter of DeleteToken
 */
export type DeleteTokenDelimiter = YastTokenDelimiter
