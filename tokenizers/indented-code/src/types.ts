import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  BlockTokenizerParsePhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof IndentedCode
 */
export const IndentedCodeType = 'INDENTED_CODE'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type IndentedCodeType = typeof IndentedCodeType


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
export interface IndentedCode extends
  YastBlockNode<IndentedCodeType>,
  BlockTokenizerParsePhaseState<IndentedCodeType> {
  /**
   * 代码内容
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
 * State data on match phase of IndentedCodeTokenizer
 */
export interface IndentedCodeMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<IndentedCodeType> {
  /**
   *
   */
  content: YastNodePoint[]
}
