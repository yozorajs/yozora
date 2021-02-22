import type {
  YastLiteral,
  YastNode,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore'


/**
 * typeof Text
 */
export const TextType = 'text'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TextType = typeof TextType


/**
 * Text represents everything that is just text.
 *
 * @example
 *    ````markdown
 *    Alpha bravo charlie.
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "text",
 *        "value": "Alpha bravo charlie."
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 */
export interface Text extends YastNode<TextType>, YastLiteral { }


/**
 * A text token.
 */
export interface TextToken extends YastToken<TextType> { }


/**
 * Delimiter of TextToken.
 */
export interface TextTokenDelimiter extends YastTokenDelimiter { }
