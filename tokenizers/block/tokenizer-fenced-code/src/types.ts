import { BlockDataNode } from '@yozora/block-tokenizer-core'


/**
 * typeof FencedCodeDataNode
 */
export const FencedCodeDataNodeType = 'FENCED_CODE'
export type FencedCodeDataNodeType = typeof FencedCodeDataNodeType


/**
 * data of FencedCodeDataNode
 */
export interface FencedCodeDataNodeData {
  /**
   * 语言
   */
  lang: string
  /**
   * 其它数据
   */
  meta: string
  /**
   * 代码内容
   */
  value: string
}


/**
 * Code (Literal) represents a block of preformatted text, such as ASCII art
 * or computer code.
 *
 * @example
 *    ````markdown
 *    ```js highlight-line="2"
 *    foo()
 *    bar()
 *    baz()
 *    ```
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'FENCED_CODE',
 *      lang: 'javascript',
 *      meta: 'highlight-line="2"',
 *      value: 'foo()\nbar()\nbaz()'
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export type FencedCodeDataNode = BlockDataNode<FencedCodeDataNodeType, FencedCodeDataNodeData>
