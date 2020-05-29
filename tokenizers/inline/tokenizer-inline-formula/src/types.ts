import {
  InlineDataNode,
  InlineTokenDelimiterItem,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof InlineFormulaDataNode
 */
export const InlineFormulaDataNodeType = 'INLINE_FORMULA'
export type InlineFormulaDataNodeType = typeof InlineFormulaDataNodeType


/**
 * 行内数学公式，mathjax 的语法，在 InlineCode 的语法上进行改造，
 * 即在 backtick string 的两侧分别添加美元符号，如：
 *
 *  inline-code (`code`) ===> inline-formula (`$code$`)
 *  inline-code (``code``) ===> inline-formula (``$code$``)
 *
 * @example
 *    ````markdown
 *    `$\displaystyle x^2 + y^2 + z^2 = 1$` `\`beta\`` `\$gamma$`
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'paragraph',
 *      children: [
 *        { type: 'INLINE_FORMULA', value: '\\displaystyle x^2 + y^2 + z^2 = 1' }
 *        { type: 'TEXT', value: ' ' },
 *        { type: 'INLINE_CODE', value: '`beta`' },
 *        { type: 'TEXT', value: ' ' },
 *        { type: 'INLINE_CODE', value: '$gamma$' }
 *      ]
 *    }
 *    ```
 */
export interface InlineFormulaDataNode extends
  InlineDataNode < InlineFormulaDataNodeType >,
  InlineTokenizerParsePhaseState<InlineFormulaDataNodeType> {
  /**
   * 行内数学公式
   */
  value: string
}



/**
 * State of pre-match phase of InlineFormulaTokenizer
 */
export interface InlineFormulaPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<InlineFormulaDataNodeType> {
  /**
   *
   */
  startIndex: number
  /**
   *
   */
  endIndex: number
  /**
   *
   */
  leftDelimiter: InlineTokenDelimiterItem
  /**
   *
   */
  rightDelimiter: InlineTokenDelimiterItem
}


/**
 * State of match phase of InlineFormulaTokenizer
 */
export interface InlineFormulaMatchPhaseState
  extends InlineTokenizerMatchPhaseState<InlineFormulaDataNodeType> {
  /**
   *
   */
  startIndex: number
  /**
   *
   */
  endIndex: number
  /**
   *
   */
  leftDelimiter: InlineTokenDelimiterItem
  /**
   *
   */
  rightDelimiter: InlineTokenDelimiterItem
  /**
   * Contents of InlineFormula
   */
  contents: {
    /**
     *
     */
    startIndex: number
    /**
     *
     */
    endIndex: number
  }
}
