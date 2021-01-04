import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  PhrasingContent,
  PhrasingContentLine,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof Heading
 */
export const HeadingType = 'HEADING'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type HeadingType = typeof HeadingType


/**
 * Heading represents a heading of a section.
 *
 * @example
 *    ````markdown
 *    # Alpha
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'HEADING',
 *      depth: 1,
 *      children: [{ type: 'TEXT', value: 'Alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 */
export interface Heading extends
  YastBlockNode<HeadingType>,
  BlockTokenizerParsePhaseState<HeadingType> {
  /**
   * level of heading
   */
  depth: number
  /**
   * Contents of heading
   */
  children: PhrasingContent[]
}


/**
 * State of match phase of HeadingTokenizer
 */
export interface HeadingMatchPhaseState
  extends BlockTokenizerMatchPhaseState<HeadingType> {
  /**
   * Level of heading
   */
  depth: number
  /**
   * Contents
   */
  lines: PhrasingContentLine[]
}
