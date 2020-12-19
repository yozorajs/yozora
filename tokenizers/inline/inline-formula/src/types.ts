import type {
  ContentFragment,
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
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
 *    ```json
 *    [
 *      {
 *        "type": "INLINE_FORMULA",
 *        "value": "displaystyle x^2 + y^2 + z^2 = 1"
 *      },
 *      {
 *        "type": "TEXT",
 *        "value": " "
 *      },
 *      {
 *        "type": "INLINE_CODE",
 *        "value": "`beta`"
 *      },
 *      {
 *        "type": "TEXT",
 *        "value": " "
 *      },
 *      {
 *        "type": "INLINE_CODE",
 *        "value": "$gamma$"
 *      }
 *    ]
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
 * Delimiter of InlineFormulaToken
 */
export interface InlineFormulaTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'both' | 'closer'> {

}


/**
 * Potential token of InlineFormula
 */
export interface InlineFormulaPotentialToken
  extends InlinePotentialToken<InlineFormulaDataNodeType, InlineFormulaTokenDelimiter> {
  /**
   * Start/Left Delimiter of InlineFormulaToken
   */
  openerDelimiter: InlineFormulaTokenDelimiter
  /**
   * End/Right Delimiter of InlineFormulaToken
   */
  closerDelimiter: InlineFormulaTokenDelimiter
}


/**
 * State of match phase of InlineFormulaTokenizer
 */
export interface InlineFormulaMatchPhaseState
  extends InlineTokenizerMatchPhaseState<InlineFormulaDataNodeType> {
  /**
   * Start/Left Delimiter of InlineFormulaToken
   */
  openerDelimiter: InlineFormulaTokenDelimiter
  /**
   * End/Right Delimiter of InlineFormulaToken
   */
  closerDelimiter: InlineFormulaTokenDelimiter
  /**
   * Contents of InlineFormula
   */
  contents: ContentFragment
}
