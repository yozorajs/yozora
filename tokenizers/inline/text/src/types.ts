import {
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof TextDataNode
 */
export const TextDataNodeType = 'TEXT'
export type TextDataNodeType = typeof TextDataNodeType


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
export interface TextDataNode extends
  InlineDataNode<TextDataNodeType>,
  InlineTokenizerParsePhaseState<TextDataNodeType> {
  /**
   * 文本内容
   * content of TextDataNode
   */
  value: string
}


/**
 * Delimiter of TextToken
 */
export interface TextTokenDelimiter
  extends InlineTokenDelimiter<'both'> {

}


/**
 * Potential token of Text
 */
export interface TextPotentialToken
  extends InlinePotentialToken<TextDataNodeType, TextTokenDelimiter> {

}


/**
 * State of pre-match phase of TextTokenizer
 */
export interface TextPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<TextDataNodeType> {

}


/**
 * State of match phase of TextTokenizer
 */
export interface TextMatchPhaseState
  extends InlineTokenizerMatchPhaseState<TextDataNodeType> {

}