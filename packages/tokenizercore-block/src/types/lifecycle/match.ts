import type { YastNodePoint } from '@yozora/tokenizercore'
import type { YastBlockNodeType } from '../node'
import type { PhrasingContentLine } from '../phrasing'


/**
 * Matchable range of rows to be processed.
 */
export interface EatingLineInfo {
  /**
   * Line no of current line.
   */
  lineNo: number
  /**
   * The starting index of the rest of the current line.
   */
  startIndex: number
  /**
   * The ending index of the rest of the current line.
   */
  endIndex: number
  /**
   * The index of first non-blank character in the rest of the current line.
   */
  firstNonWhiteSpaceIndex: number
  /**
   * Whether the remaining content of the current line is blank.
   */
  isBlankLine: boolean
}


/**
 * Result data type of {BlockTokenizerMatchPhaseHook.eatOpener}
 *
 *  * success => { state: PMS, nextIndex: number }
 *    - state: the intermediate data of the matched content
 *    - nextIndex: next position to start eating (index of nodePoints)
 *
 *  * failure => null
 */
export type ResultOfEatOpener<
  T extends YastBlockNodeType,
  PMS extends BlockTokenizerMatchPhaseState<T>> =
  | { state: PMS, nextIndex: number }
  | null


/**
 * Result data type of {BlockTokenizerMatchPhaseHook.eatAndInterruptPreviousSibling}
 *
 *  * success => { state: PMS, nextIndex: number, shouldRemovePreviousSibling: boolean }
 *    - state: the intermediate data of the matched content
 *    - nextIndex: next position to start eating (index of nodePoints)
 *    - shouldRemovePreviousSibling:
 *      - *true*:  Replace the previous sibling node; delete the last previous
 *                 node from the parent element
 *      - *false*: Keep the previous sibling node and append the current node
 *                 after the previous sibling node
 *
 *  * failure => null
 */
export type ResultOfEatAndInterruptPreviousSibling<
  T extends YastBlockNodeType,
  PMS extends BlockTokenizerMatchPhaseState<T>> =
  | { state: PMS, nextIndex: number, shouldRemovePreviousSibling: boolean }
  | null


/**
 * Result data type of {BlockTokenizerMatchPhaseHook.eatContinuationText}
 *
 *  - success => { state: PMS, nextIndex: number, finished?: false }
 *    - state: the intermediate data of the matched content (it will replace the
 *             old one which created on previous eating)
 *    - nextIndex: next position to start eating (index of nodePoints)
 *    - finished: should always be *false* or *undefined*, to indicates that the
 *                current node is not closed yet
 *
 *  - success and finished => { state: PMS, nextIndex: number, lines: PhrasingContentLine[], finished: true }
 *    - state: the intermediate data of the matched content (it will replace the
 *             old one which created on previous eating)
 *    - nextIndex: next position to start eating (index of nodePoints)
 *    - finished: should always be *true*,
 *
 *  - failure => null
 */
export type ResultOfEatContinuationText<
  T extends YastBlockNodeType,
  PMS extends BlockTokenizerMatchPhaseState<T>> =
  | { state: PMS, nextIndex: number, finished?: false }
  | { state: PMS, nextIndex: number, lines: PhrasingContentLine[], finished: true }
  | null


/**
 * Result data type of {BlockTokenizerMatchPhaseHook.eatLazyContinuationText}
 *
 *  * success => { state: PMS, nextIndex: number }
 *    - state: the intermediate data of the matched content
 *    - nextIndex: next position to start eating (index of nodePoints)*
 *
 *  * failure => null
 */
export type ResultOfEatLazyContinuationText<
  T extends YastBlockNodeType,
  PMS extends BlockTokenizerMatchPhaseState<T>> =
  | { state: PMS, nextIndex: number }
  | null


/**
 * State on match phase of BlockTokenizer
 */
export interface BlockTokenizerMatchPhaseState<
  T extends YastBlockNodeType = YastBlockNodeType,
  > {
  /**
   * Type of the DataNode
   */
  type: T
  /**
   * Is it in an opening (modifiable) state
   * @see https://github.github.com/gfm/#phase-1-block-structure
   */
  opening: boolean
  /**
   * Is it saturated, if true, ready to close it
   */
  saturated: boolean
  /**
   * Parent data node in the MatchPhaseStateTree
   */
  parent: BlockTokenizerMatchPhaseState
  /**
   * List of child nodes of current data node
   */
  children?: BlockTokenizerMatchPhaseState[]
}


/**
 * State tree on match phase of BlockTokenizer
 */
export interface BlockTokenizerMatchPhaseStateTree {
  /**
   * The root node identifier of the PreMatchPhaseStateTree
   */
  type: 'root'
  /**
   * Is it in an opening (modifiable) state
   */
  opening: boolean
  /**
   * List of child nodes of current data node
   */
  children: BlockTokenizerMatchPhaseState[]
}


/**
 * Hooks in the pre-match phase
 */
export interface BlockTokenizerMatchPhaseHook<
  T extends YastBlockNodeType = YastBlockNodeType,
  PMS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  > {
  /**
   * Try to match new block data.
   *
   * @param nodePoints
   * @param eatingInfo
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step2
   */
  eatOpener: (
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ) => ResultOfEatOpener<T, PMS>

  /**
   * Try to interrupt the eatContinuationText action of the last sibling node,
   *
   * @param nodePoints
   * @param eatingInfo
   * @param parentState
   * @param previousSiblingState
   */
  eatAndInterruptPreviousSibling?: (
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerMatchPhaseState>,
  ) => ResultOfEatAndInterruptPreviousSibling<T, PMS>

  /**
   * Try to eat the Continuation Text, and check if it is still satisfied
   * to current opening MatchState, if matches, append to the previous
   * matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param nodePoints
   * @param eatingInfo
   * @param state
   * @see https://github.github.com/gfm/#phase-1-block-structure step1
   */
  eatContinuationText?: (
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: PMS,
  ) => ResultOfEatContinuationText<T, PMS>

  /**
   * Try to eat the Laziness Continuation Text, and check if it is still
   * satisfied to current opening MatchState, if matches, append to the
   * previous matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param nodePoints
   * @param eatingInfo
   * @param state
   * @see https://github.github.com/gfm/#phase-1-block-structure step3
   */
  eatLazyContinuationText?: (
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    state: PMS,
  ) => ResultOfEatLazyContinuationText<T, PMS>

  /**
   * Called after all other hooks in pre-match phase and before match phase start
   * @param state
   */
  beforeClose?: (state: PMS) => void

  /**
   * Check whether the `child` node is accepted as a child node of state:
   *  - *false*:  Rejected this child, and close current MatchState, then
   *              go back to the grandpa node
   *  - *true*:   Accept this child, then `beforeAcceptChild` will be called.
   */
  shouldAcceptChild?: (
    state: PMS,
    childState: BlockTokenizerMatchPhaseState,
  ) => boolean

  /**
   * Called before appending child
   */
  beforeAcceptChild?: (
    state: PMS,
    childState: BlockTokenizerMatchPhaseState,
  ) => void
}
