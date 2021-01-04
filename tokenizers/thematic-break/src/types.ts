import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof ThematicBreak
 */
export const ThematicBreakType = 'THEMATIC_BREAK'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ThematicBreakType = typeof ThematicBreakType


/**
 * 分割线
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
 *      { type: 'THEMATIC_BREAK' },
 *      { type: 'THEMATIC_BREAK' },
 *      { type: 'THEMATIC_BREAK' }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#thematicbreak
 */
export interface ThematicBreak extends
  YastBlockNode<ThematicBreakType>,
  BlockTokenizerParsePhaseState<ThematicBreakType> {

}


/**
 * State of match phase of ThematicBreakTokenizer
 */
export interface ThematicBreakMatchPhaseState
  extends BlockTokenizerMatchPhaseState<ThematicBreakType> {
  /**
   * CodePoint of '-' / '_' / '*'
   */
  marker: number
  /**
   * Whether there are no internal spaces between marker characters
   */
  continuous: boolean
  /**
   * Whether is it interrupts the previous sibling node
   */
  interruptPrevious: boolean
}
