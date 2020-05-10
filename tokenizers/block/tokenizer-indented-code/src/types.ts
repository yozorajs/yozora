import { BlockDataNode } from '@yozora/block-tokenizer-core'


/**
 * typeof IndentedCodeDataNode
 */
export const IndentedCodeDataNodeType = 'INDENTED_CODE'
export type IndentedCodeDataNodeType = typeof IndentedCodeDataNodeType


/**
 * data of IndentedCodeDataNode
 */
export interface IndentedCodeDataNodeData {
  /**
   * 代码内容
   */
  value: string
}


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
export type IndentedCodeDataNode = BlockDataNode<IndentedCodeDataNodeType, IndentedCodeDataNodeData>
