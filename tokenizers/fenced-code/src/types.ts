import type { NodePoint } from '@yozora/character'
import type { YastLiteral, YastNode } from '@yozora/tokenizercore'
import type {
  PhrasingContentLine,
  YastBlockState,
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
export interface FencedCode extends YastNode<FencedCodeType>, YastLiteral {
  /**
   * Language of the codes
   */
  lang: string
  /**
   * Meta info string
   */
  meta: string
}


/**
 * Middle state during the whole match and parse phase.
 */
export interface FencedCodeState extends YastBlockState<FencedCodeType> {
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
