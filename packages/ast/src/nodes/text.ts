import type { IYastLiteral } from '../ast'

export const TextType = 'text'
export type TextType = typeof TextType

/**
 * Text represents everything that is just text.
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 */
export type Text = IYastLiteral<TextType>

/**
 * Example:
 *
 *    ````markdown
 *    Alpha bravo charlie.
 *    ````
 *
 * Yields
 *
 *    ```json
 *    {
 *      "type": "text",
 *      "value": "Alpha bravo charlie."
 *    }
 *    ```
 */
