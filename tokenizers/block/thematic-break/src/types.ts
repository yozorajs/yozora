import type {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof ThematicBreakDataNode
 */
export const ThematicBreakDataNodeType = 'THEMATIC_BREAK'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ThematicBreakDataNodeType = typeof ThematicBreakDataNodeType


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
export interface ThematicBreakDataNode extends
  BlockDataNode<ThematicBreakDataNodeType>,
  BlockTokenizerParsePhaseState<ThematicBreakDataNodeType> {

}


/**
 * State of pre-match phase of ThematicBreakTokenizer
 */
export interface ThematicBreakPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<ThematicBreakDataNodeType> {
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


/**
 * State of match phase of ThematicBreakTokenizer
 */
export interface ThematicBreakMatchPhaseState
  extends BlockTokenizerMatchPhaseState<ThematicBreakDataNodeType> {
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
