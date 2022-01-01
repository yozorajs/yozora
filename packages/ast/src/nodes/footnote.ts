import type { IYastParent } from '../ast'

export const FootnoteType = 'footnote'
export type FootnoteType = typeof FootnoteType

/**
 * Footnote represents content relating to the document that is outside its flow.
 * @see https://github.com/syntax-tree/mdast#footnote
 */
export type IFootnote = IYastParent<FootnoteType>

/**
 * Example:
 *
 *    ````markdown
 *    ^[alpha bravo]
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "footnote",
 *      "children": [
 *        {
 *          "type": "text",
 *          "value": "alpha bravo"
 *        }
 *      ]
 *    }
 *    ```
 */
