import type { YastLiteral, YastNodeInterval } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
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
export type TextMatchPhaseState =
  & InlineTokenizerMatchPhaseState<TextType>
  & TextMatchPhaseStateData


/**
 * State on post-match phase of TextTokenizer
 */
export type TextPostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<TextType>
  & TextMatchPhaseStateData


/**
 * State data on match phase of TextTokenizer
 */
export interface TextMatchPhaseStateData extends YastNodeInterval {}


/**
 * Delimiter of TextToken
 */
export interface TextTokenDelimiter extends InlineTokenDelimiter {
  type: ''
}
