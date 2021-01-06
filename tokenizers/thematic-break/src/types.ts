import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  ClosedBlockTokenizerMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof ThematicBreak
 */
export const ThematicBreakType = 'THEMATIC_BREAK'
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
 *      { type: 'THEMATIC_BREAK' },
 *      { type: 'THEMATIC_BREAK' },
 *      { type: 'THEMATIC_BREAK' }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#thematicbreak
 */
export interface ThematicBreak extends YastBlockNode<ThematicBreakType> {

}


/**
 * State on match phase of ThematicBreakTokenizer
 */
export type ThematicBreakMatchPhaseState =
  & BlockTokenizerMatchPhaseState
  & ThematicBreakMatchPhaseStateData


/**
 * State on match phase of ThematicBreakTokenizer
 */
export type ClosedThematicBreakMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & ThematicBreakMatchPhaseStateData


/**
 * State data on match phase of ThematicBreakTokenizer
 */
export interface ThematicBreakMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<ThematicBreakType> {
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
