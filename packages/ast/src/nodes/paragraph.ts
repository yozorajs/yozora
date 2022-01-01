import type { IYastParent } from '../ast'

export const ParagraphType = 'paragraph'
export type ParagraphType = typeof ParagraphType

/**
 * Paragraph represents a unit of discourse dealing with a particular
 * point or idea.
 * @see https://github.com/syntax-tree/mdast#paragraph
 * @see https://github.github.com/gfm/#paragraphs
 */
export type IParagraph = IYastParent<ParagraphType>

/**
 * Example:
 *
 *    ````markdown
 *    Alpha bravo charlie.
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "paragraph",
 *      "children": [
 *        {
 *          "type": "text",
 *          "value": "Alpha bravo charlie."
 *        }
 *      ]
 *    }
 *    ```
 */
