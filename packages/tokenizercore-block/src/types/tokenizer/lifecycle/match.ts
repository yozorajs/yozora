import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type { YastBlockNodeType } from '../../node'
import type { PhrasingContentLine } from '../phrasing-content'


/**
 * Hooks in the pre-match phase
 */
export interface BlockTokenizerMatchPhaseHook<
  T extends YastBlockNodeType = YastBlockNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ) => ResultOfEatOpener<T, MS>

  /**
   * Try to interrupt the eatContinuationText action of the last sibling node.
   *
   * @param nodePoints
   * @param eatingInfo
   * @param previousSiblingState
   * @param parentState
   */
  eatAndInterruptPreviousSibling?: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    previousSiblingState: Readonly<BlockTokenizerMatchPhaseState>,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ) => ResultOfEatAndInterruptPreviousSibling<T, MS>

  /**
   * Try to eat the Continuation Text, and check if it is still satisfied
   * to current opening MatchState, if matches, append to the previous
   * matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param nodePoints
   * @param eatingInfo
   * @param state
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step1
   */
  eatContinuationText?: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ) => ResultOfEatContinuationText

  /**
   * Try to eat the Laziness Continuation Text, and check if it is still
   * satisfied to current opening MatchState, if matches, append to the
   * previous matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param nodePoints
   * @param eatingInfo
   * @param state
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step3
   */
  eatLazyContinuationText?: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ) => ResultOfEatLazyContinuationText

  /**
   * Called after all other hooks in pre-match phase and before match phase start
   * @param state
   */
  beforeClose?: (state: MS) => void

  /**
   * Check whether the `child` node is accepted as a child node of state:
   *  - *false*:  Rejected this child, and close current MatchState, then
   *              go back to the grandpa node
   *  - *true*:   Accept this child, then `beforeAcceptChild` will be called.
   *
   * @param state
   * @param childState
   * @returns {boolean}
   */
  shouldAcceptChild?: (
    state: MS,
    childState: BlockTokenizerMatchPhaseState,
  ) => boolean

  /**
   * Called before appending child
   */
  beforeAcceptChild?: (
    state: MS,
    childState: BlockTokenizerMatchPhaseState,
  ) => void
}


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
 * State on match phase of BlockTokenizer
 */
export interface BlockTokenizerMatchPhaseState<
  T extends YastBlockNodeType = YastBlockNodeType> {
  /**
   * Type of a state node
   */
  type: T
}


/**
 * # Returned on success
 *    => {
 *      state: MS
 *      nextIndex: number
 *      saturated?: boolean
 *    }
 *
 *  * state: intermediate state data during the match phase
 *  * nextIndex: next match position (index of nodePoints)
 *  * saturated: whether the matching has been completed
 *
 * # Returned on Failure
 *    => null
 *
 * @see BlockTokenizerMatchPhaseHook.eatOpener
 */
export type ResultOfEatOpener<
  T extends YastBlockNodeType = YastBlockNodeType ,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>> =
  | {
    state: MS
    nextIndex: number
    saturated?: boolean
  }
  | null


/**
 * # Returned on success
 *    => {
 *      state: MS
 *      nextIndex: number
 *      saturated?: true
 *      shouldRemovePreviousSibling?: boolean
 *    }
 *
 *  * state: intermediate state data during the match phase
 *  * nextIndex: next match position (index of nodePoints)
 *  * saturated: whether the matching has been completed
 *  * shouldRemovePreviousSibling:
 *    - *true*:  Replace the previous sibling state with the new returned state
 *    - *false*: Keep the previous sibling state and append the new returned state
 *               after the previous sibling state
 *
 *  * failure => null
 *
 * @see BlockTokenizerMatchPhaseHook.eatAndInterruptPreviousSibling
 */
export type ResultOfEatAndInterruptPreviousSibling<
  T extends YastBlockNodeType = YastBlockNodeType ,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>> =
  | {
    state: MS,
    nextIndex: number
    saturated?: boolean
    shouldRemovePreviousSibling?: true
  }
  | null


/**
 * # Returned on success
 *    => {
 *      nextIndex: number
 *      saturated?: boolean
 *    }
 *
 *  * saturated: whether the matching has been completed
 *  * nextIndex: next match position (index of nodePoints)
 *
 * # Returned on failure
 *
 *    => {
 *      nextIndex: number
 *      lines: PhrasingContentLine[]
 *    }
 *
 *  * nextIndex: next match position (index of nodePoints)
 *  * lines:
 *
 * # No further contents matched (but not all failed)
 *    => null
 *
 * @see BlockTokenizerMatchPhaseHook
 */
export type ResultOfEatContinuationText =
  | {
    failed?: false
    nextIndex: null
    saturated: true
  }
  | {
    failed?: false
    nextIndex: number
    saturated?: boolean
  }
  | {
    failed: true,
    nextIndex?: number
    saturated?: boolean
    lines: PhrasingContentLine[]
  }
  | null


/**
 * @see BlockTokenizerMatchPhaseHook.eatLazyContinuationText
 */
export interface ResultOfEatLazyContinuationText {
  /**
   * Next match position (index of nodePoints)
   */
  nextIndex: number | null
  /**
   * Whether the matching has been completed
   *
   *  - *true*: ready to close the node contains this state
   *  - *false*: could continue match contents
   *
   * @default false
   */
  saturated?: boolean
}
