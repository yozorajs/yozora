import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  BlockTokenizerParsePhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof FencedCode
 */
export const FencedCodeType = 'FENCED_CODE'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type FencedCodeType = typeof FencedCodeType


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
export interface FencedCode extends
  YastBlockNode<FencedCodeType>,
  BlockTokenizerParsePhaseState<FencedCodeType> {
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
 * State on match phase of FencedCodeTokenizer
 */
export type FencedCodeMatchPhaseState =
  & BlockTokenizerMatchPhaseState
  & FencedCodeMatchPhaseStateData


/**
 * State data on match phase of FencedCodeTokenizer
 */
export interface FencedCodeMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<FencedCodeType> {
  /**
   *
   */
  indent: number
  /**
   *
   */
  marker: number
  /**
   *
   */
  markerCount: number
  /**
   *
   */
  nodePoints: YastNodePoint[]
  /**
   *
   */
  infoString: YastNodePoint[]
}
