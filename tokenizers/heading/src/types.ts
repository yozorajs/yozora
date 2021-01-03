import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
  PhrasingContentDataNode,
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
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
  children?: [PhrasingContentDataNode]
}


/**
 * State of pre-match phase of HeadingTokenizer
 */
export interface HeadingPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<HeadingType> {
  /**
   * Level of heading
   */
  depth: number
  /**
   * PhrasingContent 中的文本内容
   */
  lines: PhrasingContentLine[]
  /**
   * No children of Heading in the pre-match phase
   */
  children?: undefined
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
   * Contents of heading
   */
  children: [PhrasingContentMatchPhaseState]
}
