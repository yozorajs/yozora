import {
  InlineDataNode,
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
 *    ```js
 *    { type: 'TEXT', value: 'Alpha bravo charlie.' }
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
 * State of pre-match phase of TextTokenizer
 */
export interface TextPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<TextDataNodeType> {
  /**
   * 起始下标
   */
  startIndex: number
  /**
   * 结束下标
   */
  endIndex: number
}


/**
 * State of match phase of TextTokenizer
 */
export interface TextMatchPhaseState
  extends InlineTokenizerMatchPhaseState<TextDataNodeType> {
  /**
   * 起始下标
   */
  startIndex: number
  /**
   * 结束下标
   */
  endIndex: number
}
