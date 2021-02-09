import type { YastLiteral, YastNode } from '@yozora/tokenizercore'
import type {
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Text
 */
export const TextType = 'text'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type TextType = typeof TextType


/**
 * 行内文本
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
