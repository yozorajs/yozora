import type { NodePoint } from '@yozora/character'
import type { YastNode } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  PhrasingContentLine,
} from '@yozora/tokenizercore-block'


/**
 * typeof FencedCode
 */
export const FencedCodeType = 'fencedCode'
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
 *      type: 'fencedCode',
 *      lang: 'javascript',
 *      meta: 'highlight-line="2"',
 *      value: 'foo()\nbar()\nbaz()'
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export interface FencedCode extends YastNode<FencedCodeType> {
  /**
   * Language of the codes
   */
  lang: string
  /**
   * Meta info string
   */
  meta: string
  /**
   * Codes
   */
  value: string
}


/**
 * State on match phase of FencedCodeTokenizer
 */
export type FencedCodeMatchPhaseState =
  & BlockTokenizerMatchPhaseState<FencedCodeType>
  & FencedCodeMatchPhaseStateData


/**
 * State on post-match phase of FencedCodeTokenizer
 */
export type FencedCodePostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<FencedCodeType>
  & FencedCodeMatchPhaseStateData


/**
 * State data on match phase of FencedCodeTokenizer
 */
export interface FencedCodeMatchPhaseStateData {
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
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
  /**
   * Meta info string
   */
  infoString: NodePoint[]
}
