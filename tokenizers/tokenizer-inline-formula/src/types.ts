import { InlineDataNode } from '@yozora/tokenizer-core'


/**
 * typeof InlineFormulaDataNode
 */
export const InlineFormulaDataNodeType = 'INLINE_FORMULA'
export type InlineFormulaDataNodeType = typeof InlineFormulaDataNodeType


/**
 * data of InlineFormulaDataNode
 */
export interface InlineFormulaDataNodeData {
  /**
   * 行内数学公式
   */
  value: string
}


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
export type InlineFormulaDataNode = InlineDataNode<InlineFormulaDataNodeType, InlineFormulaDataNodeData>
