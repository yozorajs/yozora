import { InlineDataNode, InlineDataNodeType } from './_base'


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
 *        { type: 'inline-formula', value: '\\displaystyle x^2 + y^2 + z^2 = 1' }
 *        { type: 'text', value: ' ' },
 *        { type: 'inline-code', value: '`beta`' },
 *        { type: 'text', value: ' ' },
 *        { type: 'inline-code', value: '$gamma$' }
 *      ]
 *    }
 *    ```
 */
export interface InlineFormulaDataNode extends InlineDataNode<InlineDataNodeType.INLINE_FORMULA> {
  /**
   * 行内数学公式
   */
  value: string
}
