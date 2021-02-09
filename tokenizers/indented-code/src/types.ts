import type { YastNode } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  PhrasingContentLine,
} from '@yozora/tokenizercore-block'


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
export interface IndentedCode extends YastNode<IndentedCodeType> {
  /**
   * Codes
   */
  value: string
}


/**
 * State on match phase of IndentedCodeTokenizer
 */
export type IndentedCodeMatchPhaseState =
  & BlockTokenizerMatchPhaseState<IndentedCodeType>
  & IndentedCodeMatchPhaseStateData


/**
 * State on post-match phase of IndentedCodeTokenizer
 */
export type IndentedCodePostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<IndentedCodeType>
  & IndentedCodeMatchPhaseStateData


/**
 * State data on match phase of IndentedCodeTokenizer
 */
export interface IndentedCodeMatchPhaseStateData {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
}
