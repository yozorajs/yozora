import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof FencedCodeDataNode
 */
export const FencedCodeDataNodeType = 'FENCED_CODE'
export type FencedCodeDataNodeType = typeof FencedCodeDataNodeType


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
export interface FencedCodeDataNode extends
  BlockDataNode<FencedCodeDataNodeType>,
  BlockTokenizerParsePhaseState<FencedCodeDataNodeType> {
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
 * State of pre-match phase of FencedCodeTokenizer
 */
export interface FencedCodePreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<FencedCodeDataNodeType> {
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
  codePoints: DataNodeTokenPointDetail[]
  /**
   *
   */
  infoString: DataNodeTokenPointDetail[]
}


/**
 * State of match phase of FencedCodeTokenizer
 */
export interface FencedCodeMatchPhaseState
  extends BlockTokenizerMatchPhaseState<FencedCodeDataNodeType> {
  /**
   *
   */
  indent: number
  /**
   *
   */
  codePoints: DataNodeTokenPointDetail[]
  /**
   *
   */
  infoString: DataNodeTokenPointDetail[]
}
