import type {
  ContentFragment,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof InlineFormula
 */
export const InlineFormulaType = 'INLINE_FORMULA'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type InlineFormulaType = typeof InlineFormulaType


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
export interface InlineFormula extends
  YastInlineNode < InlineFormulaType >,
  InlineTokenizerParsePhaseState<InlineFormulaType> {
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
  extends InlinePotentialToken<InlineFormulaType, InlineFormulaTokenDelimiter> {
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
  extends InlineTokenizerMatchPhaseState<InlineFormulaType> {
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
