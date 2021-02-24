import type { YastBlockState, YastNode } from '@yozora/tokenizercore'

/**
 * typeof ThematicBreak
 */
export const ThematicBreakType = 'thematicBreak'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ThematicBreakType = typeof ThematicBreakType

/**
 * ThematicBreak (Node) represents a thematic break, such as a scene change in
 * a story, a transition to another topic, or a new document.
 *
 * @example
 *    ````markdown
 *    ***
 *    ---
 *    ___
 *    ````
 *    ===>
 *    ```js
 *    [
 *      { type: 'thematicBreak' },
 *      { type: 'thematicBreak' },
 *      { type: 'thematicBreak' }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#thematicbreak
 * @see https://github.github.com/gfm/#thematic-break
 */
export interface ThematicBreak extends YastNode<ThematicBreakType> {}

/**
 * Middle state during the whole match and parse phase.
 */
export interface ThematicBreakState extends YastBlockState<ThematicBreakType> {
  /**
   * CodePoint of '-' / '_' / '*'
   */
  marker: number
  /**
   * Whether there are no internal spaces between marker characters
   */
  continuous: boolean
}
