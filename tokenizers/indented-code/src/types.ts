import type {
  PhrasingContentLine,
  YastBlockState,
  YastLiteral,
  YastNode,
} from '@yozora/tokenizercore'

/**
 * typeof IndentedCode
 */
export const IndentedCodeType = 'indentedCode'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type IndentedCodeType = typeof IndentedCodeType

/**
 * Indented code block
 * @example
 *    ````markdown
 *    ```
 *    foo()
 *    bar()
 *    baz()
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'indentedCode',
 *      value: 'foo()\nbar()\nbaz()'
 *    }
 *    ```
 * @see https://github.github.com/gfm/#indented-code-blocks
 */
export interface IndentedCode extends YastNode<IndentedCodeType>, YastLiteral {}

/**
 * Middle state during the whole match and parse phase.
 */
export interface IndentedCodeState extends YastBlockState<IndentedCodeType> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
}
