import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  ClosedBlockTokenizerMatchPhaseState,
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
  & BlockTokenizerMatchPhaseState
  & IndentedCodeMatchPhaseStateData


/**
 * Closed state on match phase of IndentedCodeTokenizer
 */
export type ClosedIndentedCodeMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & IndentedCodeMatchPhaseStateData


/**
 * State data on match phase of IndentedCodeTokenizer
 */
export interface IndentedCodeMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<IndentedCodeType> {
  /**
   *
   */
  contents: EnhancedYastNodePoint[]
}
