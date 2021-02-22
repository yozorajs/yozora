import type {
  PhrasingContent,
  PhrasingContentLine,
  YastBlockState,
  YastNode,
  YastParent,
} from '@yozora/tokenizercore'


/**
 * typeof Heading
 */
export const HeadingType = 'heading'
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
 *      type: 'heading',
 *      depth: 1,
 *      children: [{ type: 'text', value: 'Alpha' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 */
export interface Heading extends YastNode<HeadingType>, YastParent {
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
 * Middle state during the whole match and parse phase.
 */
export interface HeadingState extends YastBlockState<HeadingType> {
  /**
   * Level of heading
   */
  depth: number
  /**
   * Contents
   */
  line: PhrasingContentLine
}
