import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof IndentedCode
 */
export const IndentedCodeType = 'INDENTED_CODE'
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
 *      type: 'INDENTED_CODE',
 *      value: 'foo()\nbar()\nbaz()'
 *    }
 *    ```
 * @see https://github.github.com/gfm/#indented-code-blocks
 */
export interface IndentedCode extends YastBlockNode<IndentedCodeType> {
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
   *
   */
  contents: EnhancedYastNodePoint[]
}
