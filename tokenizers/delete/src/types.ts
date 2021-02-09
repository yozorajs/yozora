import type { YastNode, YastParent } from '@yozora/tokenizercore'
import type {
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Delete
 */
export const DeleteType = 'delete'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DeleteType = typeof DeleteType


/**
 * 删除线
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
 */
export interface Delete extends YastNode<DeleteType>, YastParent<YastNode> { }


/**
 * A `delete` token.
 */
export interface DeleteToken extends YastToken<DeleteType> { }


/**
 * Delimiter of DeleteToken
 */
export interface DeleteTokenDelimiter extends YastTokenDelimiter { }
