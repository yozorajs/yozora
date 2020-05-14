import {
  BlockDataNode,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof IndentedCodeDataNode
 */
export const IndentedCodeDataNodeType = 'INDENTED_CODE'
export type IndentedCodeDataNodeType = typeof IndentedCodeDataNodeType


/**
 * 缩进代码块
 *
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
 *      type: 'INDENTED_CODE',
 *      value: 'foo()\nbar()\nbaz()'
 *    }
 *    ```
 * @see https://github.github.com/gfm/#indented-code-blocks
 */
export interface IndentedCodeDataNode extends
  BlockDataNode<IndentedCodeDataNodeType>,
  BlockTokenizerParsePhaseState<IndentedCodeDataNodeType> {
  /**
   * 代码内容
   */
  value: string
}
