import type {
  TokenizerHookState,
  TokenizerHookStateTree,
  YastNodePoint,
} from '@yozora/tokenizercore'
import type { YastBlockNodeType } from '../node'
import type {
  PhrasingContentLine,
  PhrasingContentMatchPhaseState,
} from '../phrasing-content'


/**
 * Hooks in the pre-match phase
 */
export interface BlockTokenizerMatchPhaseHook<
  T extends YastBlockNodeType = YastBlockNodeType,
  MSD extends BlockTokenizerMatchPhaseStateData<T> = BlockTokenizerMatchPhaseStateData<T>,
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
  ) => ResultOfEatOpener<T, MSD>

  /**
   * Try to interrupt the eatContinuationText action of the last sibling node.
   *
   * @param nodePoints
   * @param eatingInfo
   * @param parentState
   * @param previousSiblingState
   * @param extractPhrasingContentMatchPhaseState
   */
  eatAndInterruptPreviousSibling?: (
    nodePoints: YastNodePoint[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerMatchPhaseState>,
    extractPhrasingContentMatchPhaseState?: () => PhrasingContentMatchPhaseState | null,
  ) => ResultOfEatAndInterruptPreviousSibling<T, MSD>

  /**
   * Check if the previous node can be interrupted.
   *
   * If this function is not present, it's equivalent to defined
   *  `couldInterruptPreviousSibling = () => false`.
   *
   * Otherwise, the context will try to call `this.eatAndInterruptPreviousSibling` first,
   * then try to call `this.eatOpener` if the previous one is absent.
   *
   * @param type      type of previous sibling node
   * @param priority  priority of the tokenizer which is responsible for
   *                  the previous sibling node
   */
  couldInterruptPreviousSibling?: (
    type: YastBlockNodeType,
    priority: number,
  ) => boolean

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
    state: BlockTokenizerMatchPhaseState & MSD,
  ) => ResultOfEatContinuationText<T, MSD>

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
    state: BlockTokenizerMatchPhaseState & MSD,
  ) => ResultOfEatLazyContinuationText<T, MSD>

  /**
   * Called after all other hooks in pre-match phase and before match phase start
   * @param state
   */
  beforeClose?: (state: BlockTokenizerMatchPhaseState & MSD) => void

  /**
   * Check whether the `child` node is accepted as a child node of state:
   *  - *false*:  Rejected this child, and close current MatchState, then
   *              go back to the grandpa node
   *  - *true*:   Accept this child, then `beforeAcceptChild` will be called.
   */
  shouldAcceptChild?: (
    state: BlockTokenizerMatchPhaseState & MSD,
    childState: BlockTokenizerMatchPhaseState,
  ) => boolean

  /**
   * Called before appending child
   */
  beforeAcceptChild?: (
    state: BlockTokenizerMatchPhaseState & MSD,
    childState: BlockTokenizerMatchPhaseState,
  ) => void

  /**
   * Extract PhrasingContentMatchPhaseState from a match phase state
   */
  extractPhrasingContentMatchPhaseState?: (
    state: Readonly<BlockTokenizerMatchPhaseState & MSD>,
  ) => PhrasingContentMatchPhaseState | null
}


/**
 * State tree on match phase of BlockTokenizer
 */
export interface BlockTokenizerMatchPhaseStateTree
  extends TokenizerHookStateTree<BlockTokenizerMatchPhaseState> {
  /**
   * Is it in an opening (modifiable) state
   */
  opening: boolean
}


/**
 * State on match phase of BlockTokenizer
 */
export interface BlockTokenizerMatchPhaseState
  extends TokenizerHookState<BlockTokenizerMatchPhaseState> {
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
   * Parent node
   */
  parent: BlockTokenizerMatchPhaseState
}


/**
 * Closed state tree on match phase of BlockTokenizer
 */
export interface ClosedBlockTokenizerMatchPhaseStateTree
  extends TokenizerHookStateTree<ClosedBlockTokenizerMatchPhaseState> {}


/**
 * Closed state on match phase of BlockTokenizer
 */
export interface ClosedBlockTokenizerMatchPhaseState
  extends TokenizerHookState<ClosedBlockTokenizerMatchPhaseState> {}


/**
 * State data on match phase of BlockTokenizer
 */
export interface BlockTokenizerMatchPhaseStateData<
  T extends YastBlockNodeType = YastBlockNodeType> {
  /**
   * Type of a state node
   */
  type: T
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
 * Result data type of {BlockTokenizerMatchPhaseHook.eatOpener}
 *
 *  * success => {
 *        state: BlockTokenizerMatchPhaseState | MSD,
 *        nextIndex: number }
 *
 *    - state: the intermediate data of the matched content
 *    - nextIndex: next position to start eating (index of nodePoints)
 *
 *  * failure => null
 */
export type ResultOfEatOpener<
  T extends YastBlockNodeType,
  MSD extends BlockTokenizerMatchPhaseStateData<T>> =
  | {
    state: BlockTokenizerMatchPhaseState & MSD,
    nextIndex: number
  }
  | null


/**
 * Result data type of {BlockTokenizerMatchPhaseHook.eatAndInterruptPreviousSibling}
 *
 *  * success => {
 *        state: BlockTokenizerMatchPhaseState | MSD,
 *        nextIndex: number,
 *        shouldRemovePreviousSibling: boolean }
 *
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
  T extends YastBlockNodeType = YastBlockNodeType,
  MSD extends BlockTokenizerMatchPhaseStateData<T> = BlockTokenizerMatchPhaseStateData<T>> =
  | {
    state: BlockTokenizerMatchPhaseState & MSD,
    nextIndex: number,
    shouldRemovePreviousSibling: boolean
  }
  | null


/**
 * Result data type of {BlockTokenizerMatchPhaseHook.eatContinuationText}
 *
 *  - success => {
 *        finished?: false,
 *        state: BlockTokenizerMatchPhaseState & MSD,
 *        nextIndex: number }
 *
 *    - finished: should always be *false* or *undefined*, to indicates that the
 *                current node is not closed yet
 *    - state: the intermediate data of the matched content (it will replace the
 *             old one which created on previous eating)
 *    - nextIndex: next position to start eating (index of nodePoints)
 *
 *  - success and finished => {
 *        finished: true,
 *        state: (BlockTokenizerMatchPhaseState & MSD) | null,
 *        nextIndex: number,
 *        lines: PhrasingContentLine[] }
 *
 *    - finished: should always be *true*, to indicates that the current node is closed.
 *    - state: the intermediate data of the matched content (it will replace the
 *             old one which created on previous eating)
 *    - nextIndex: next position to start eating (index of nodePoints)
 *
 *  - failure => null
 */
export type ResultOfEatContinuationText<
  T extends YastBlockNodeType,
  MSD extends BlockTokenizerMatchPhaseStateData<T>> =
  | {
    finished?: false,
    state: BlockTokenizerMatchPhaseState & MSD,
    nextIndex: number
  }
  | {
    finished: true,
    state: (BlockTokenizerMatchPhaseState & MSD) | null,
    nextIndex: number,
    lines: PhrasingContentLine[]
  }
  | null


/**
 * Result data type of {BlockTokenizerMatchPhaseHook.eatLazyContinuationText}
 *
 *  * success => {
 *        state: BlockTokenizerMatchPhaseState & MSD,
 *        nextIndex: number }
 *
 *    - state: the intermediate data of the matched content
 *    - nextIndex: next position to start eating (index of nodePoints)*
 *
 *  * failure => null
 */
export type ResultOfEatLazyContinuationText<
  T extends YastBlockNodeType,
  MSD extends BlockTokenizerMatchPhaseStateData<T>> =
  | {
    state: BlockTokenizerMatchPhaseState & MSD,
    nextIndex: number
  }
  | null
