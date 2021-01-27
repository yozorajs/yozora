import type { YastLiteral } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  YastInlineNode,
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
export interface Text extends YastInlineNode<TextType>, YastLiteral {

}


/**
 * State on match phase of TextTokenizer
 */
export interface TextMatchPhaseState
  extends InlineTokenizerMatchPhaseState<TextType> {

}


/**
 * Delimiter of TextToken.
 */
export interface TextTokenDelimiter extends InlineTokenDelimiter {

}
