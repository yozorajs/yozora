import type { YastLiteral } from '@yozora/tokenizercore'
import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Text
 */
export const TextType = 'TEXT'
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
 *        "type": "TEXT",
 *        "value": "Alpha bravo charlie."
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#text
 */
export interface Text extends
  YastLiteral<TextType>,
  InlineTokenizerParsePhaseState<TextType> {
  /**
   * 文本内容
   * content of Text
   */
  value: string
}


/**
 * Delimiter of TextToken
 */
export interface TextTokenDelimiter extends InlineTokenDelimiter {
  type: ''
}


/**
 * Potential token of Text
 */
export interface TextPotentialToken
  extends InlinePotentialToken<TextType, TextTokenDelimiter> {

}


/**
 * State of match phase of TextTokenizer
 */
export interface TextMatchPhaseState
  extends InlineTokenizerMatchPhaseState<TextType> {

}
