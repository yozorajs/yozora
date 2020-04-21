import { BlockDataNode } from '@yozora/tokenizer-core'


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
