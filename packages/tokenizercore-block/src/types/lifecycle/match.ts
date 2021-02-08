import type { NodePoint } from '@yozora/character'
import type { YastBlockNodeType } from '../node'
import type { PhrasingContentLine } from '../phrasing-content'


/**
 * Hooks in the pre-match phase
 */
export interface BlockTokenizerMatchPhaseHook<
  T extends YastBlockNodeType = YastBlockNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  > {
  /**
   * Whether if it is a container block.
   */
  readonly isContainerBlock: boolean

  /**
   * YastNode types that can be interrupt by this BlockTokenizer,
   * used in couldInterruptPreviousSibling, you can overwrite that function to
   * mute this properties
   */
  readonly interruptableTypes: ReadonlyArray<YastBlockNodeType>

  /* k
   * Try to match new block data.
   *
   * @param nodePoints
   * @param eatingInfo
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step2
   */
  eatOpener: (
    nodePoints: ReadonlyArray<NodePoint>,
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
    nodePoints: ReadonlyArray<NodePoint>,
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
    nodePoints: ReadonlyArray<NodePoint>,
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
    nodePoints: ReadonlyArray<NodePoint>,
    eatingInfo: EatingLineInfo,
    state: MS,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
  ) => ResultOfEatLazyContinuationText

  /**
   * Called when the state is saturated.
   * @param state
   */
  onClose?: (state: MS) => ResultOfOnClose
}


/**
 * Matchable range of rows to be processed.
 */
export interface EatingLineInfo {
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
  firstNonWhitespaceIndex: number
  /**
   * The precede space count, one tab equals four space.
   * @see https://github.github.com/gfm/#tabs
   */
  countOfPrecedeSpaces: number
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
 * @see BlockTokenizerMatchPhaseHook
 */
export type ResultOfEatContinuationText =
  | { // Match failed, and the whole state should be destroyed and rollback.
    status: 'failedAndRollback'
    lines: PhrasingContentLine[]
  }
  | { // Match failed, but only the last lines should be rollback.
    status: 'closingAndRollback'
    lines: PhrasingContentLine[]
  }
  | { // Match failed, but there may be some lazy continuation text exists.
    status: 'notMatched'
  }
  | { // Match succeed, and current state is ready to be closed.
    status: 'closing'
    nextIndex: number
  }
  | { // Match succeed, and current state is still in opening.
    status: 'opening'
    nextIndex: number
  }


/**
 * @see BlockTokenizerMatchPhaseHook.eatLazyContinuationText
 */
export type ResultOfEatLazyContinuationText =
  | {
    status: 'notMatched'
  }
  | {
    status: 'opening'
    nextIndex: number
  }


/**
 * @see BlockTokenizerMatchPhaseHook
 */
export type ResultOfOnClose =
  | { // Match failed, and the whole state should be destroyed and rollback.
    status: 'failedAndRollback'
    lines: PhrasingContentLine[]
  }
  | { // Match failed, but only the last lines should be rollback.
    status: 'closingAndRollback'
    lines: PhrasingContentLine[]
  }
  | void
