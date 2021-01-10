import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
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
export interface Heading extends YastBlockNode<HeadingType> {
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
 * State on match phase of HeadingTokenizer
 */
export type HeadingMatchPhaseState =
  & BlockTokenizerMatchPhaseState<HeadingType>
  & HeadingMatchPhaseStateData


/**
 * State on post-match phase of HeadingTokenizer
 */
export type HeadingPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<HeadingType>
  & HeadingMatchPhaseStateData


/**
 * State data on match phase of HeadingTokenizer
 */
export interface HeadingMatchPhaseStateData {
  /**
   * Level of heading
   */
  depth: number
  /**
   * Contents
   */
  lines: PhrasingContentLine[]
}
