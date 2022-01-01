import type { IYastParent } from '../ast'

export const BlockquoteType = 'blockquote'
export type BlockquoteType = typeof BlockquoteType

/**
 * Blockquote represents a section quoted from somewhere else.
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 */
export type IBlockquote = IYastParent<BlockquoteType>

/**
 * Example:
 *
 *    ````markdown
 *    > Alpha bravo charlie.
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "blockquote",
 *      "children": [
 *        {
 *          "type": "paragraph",
 *          "children": [
 *            {
 *              "type": "text",
 *              "value": "Alpha bravo charlie."
 *            }
 *          ]
 *        }
 *      ]
 *    }
 *    ```
 */
