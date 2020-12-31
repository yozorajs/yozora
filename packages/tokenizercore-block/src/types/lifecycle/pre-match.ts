import type { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import type { BlockDataNodeType, EatingLineInfo } from '../base'
import type { PhrasingContentLine } from '../phrasing'


/**
 * Result data type of {BlockTokenizerPreMatchPhaseHook.eat}
 *
 *  - success => { state: PMS, nextIndex: number }
 *    - state: matched content and metadata
 *    - nextIndex: next eat position (index of codePositions)
 *
 *  - failure => null
 */
export type EatNewMarkerResult<
  T extends BlockDataNodeType,
  PMS extends BlockTokenizerPreMatchPhaseState<T>> =
  | { state: PMS, nextIndex: number }
  | null


/**
 * Result data type of {BlockTokenizerPreMatchPhaseHook.eatAndInterruptPreviousSibling}
 *
 *  - success => { state: PMS, nextIndex: number, shouldRemovePreviousSibling: boolean }
 *    - state: matched content and metadata
 *    - nextIndex: next eat position (index of codePositions)
 *    - shouldRemovePreviousSibling:
 *      - {true}:  Replace the previous sibling node; delete the last previous
 *                 node from the parent element
 *      - {false}: Keep the previous sibling node and append the current node
 *                 after the previous sibling node
 *
 *  - failure => null
 */
export type EatAndInterruptPreviousSiblingResult<
  T extends BlockDataNodeType,
  PMS extends BlockTokenizerPreMatchPhaseState<T>> =
  | { state: PMS, nextIndex: number, shouldRemovePreviousSibling: boolean }
  | null


/**
 * Result data type of {BlockTokenizerPreMatchPhaseHook.eatContinuationText}
 *
 *  - success => { resultType: 'continue', state: PMS, nextIndex: number }
 *    - resultType:
 *    - state: matched content and metadata (it will replace the old one from
 *             previous eating)
 *    - nextIndex: next eat position (index of codePositions)
 *
 *  - half success => { resultType: 'finished', state?: PMS, nextIndex: number,
 *                      lines: PhrasingContentLine[] }
 *    - resultType: abandon current state and to construct a state of fallback Tokenizer
 *    - state: matched content and metadata (it will replace the old one from previous eating)
 *    - nextIndex: next eat position (index of codePositions)
 *    - lines:
 *
 *  - failure => null
 */
export type EatContinuationTextResult<
  T extends BlockDataNodeType,
  PMS extends BlockTokenizerPreMatchPhaseState<T>> =
  | { resultType: 'continue', state: PMS, nextIndex: number }
  | { resultType: 'finished', state?: PMS, nextIndex: number, lines: PhrasingContentLine[] }
  | null


/**
 * Result data type of {BlockTokenizerPreMatchPhaseHook.eatLazyContinuationText}
 *
 *  - success => { state: PMS, nextIndex: number }
 *    - state: matched content and metadata (it will replace the old one from previous eating)
 *    - nextIndex: next eat position (index of codePositions)
 *
 *  - failure => null
 */
export type EatLazyContinuationTextResult<
  T extends BlockDataNodeType,
  PMS extends BlockTokenizerPreMatchPhaseState<T>> =
  | { state: PMS, nextIndex: number }
  | null


/**
 * State of pre-match phase
 */
export interface BlockTokenizerPreMatchPhaseState<
  T extends BlockDataNodeType = BlockDataNodeType,
  > {
  /**
   * Type of DataNode
   */
  type: T
  /**
   * Is it in an opening (modifiable) state
   * @see https://github.github.com/gfm/#phase-1-block-structure
   */
  opening: boolean
  /**
   * Whether the current node is saturated, if true, ready to close it
   */
  saturated: boolean
  /**
   * Parent data node in the MatchPhaseStateTree
   */
  parent: BlockTokenizerPreMatchPhaseState
  /**
   * List of child nodes of current data node
   */
  children?: BlockTokenizerPreMatchPhaseState[]
}


/**
 * State-tree of pre-match phase
 */
export interface BlockTokenizerPreMatchPhaseStateTree {
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
  children: BlockTokenizerPreMatchPhaseState[]
}


/**
 * Hooks in the pre-match phase
 */
export interface BlockTokenizerPreMatchPhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  PMS extends BlockTokenizerPreMatchPhaseState<T> = BlockTokenizerPreMatchPhaseState<T>,
  > {
  /**
   * Try to match new block data.
   *
   * @param codePositions
   * @param eatingInfo
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step2
   */
  eatNewMarker: (
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ) => EatNewMarkerResult<T, PMS>

  /**
   * Try to interrupt the eatContinuationText action of the last sibling node,
   *
   * @param codePositions
   * @param eatingInfo
   * @param parentState
   * @param previousSiblingState
   */
  eatAndInterruptPreviousSibling?: (
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: EatingLineInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ) => EatAndInterruptPreviousSiblingResult<T, PMS>

  /**
   * Try to eat the Continuation Text, and check if it is still satisfied
   * to current opening MatchState, if matches, append to the previous
   * matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param codePositions
   * @param eatingInfo
   * @param state
   * @returns

   *
   * @see https://github.github.com/gfm/#phase-1-block-structure step1
   */
  eatContinuationText?: (
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: EatingLineInfo,
    state: PMS,
  ) => EatContinuationTextResult<T, PMS>

  /**
   * Try to eat the Laziness Continuation Text, and check if it is still
   * satisfied to current opening MatchState, if matches, append to the
   * previous matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param codePositions
   * @param eatingInfo
   * @param state
   * @returns
   *  * `null`: Not a valid LazyContinuation Text of current DataNode,
   *    ready to close it
   *  * `{nextIndex: number, saturated: boolean}:
   *    - nextIndex: next eat position
   *    - saturated: Whether the current node is saturated, if true,
   *      ready to close i
   * @see https://github.github.com/gfm/#phase-1-block-structure step3
   */
  eatLazyContinuationText?: (
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: EatingLineInfo,
    state: PMS,
  ) => EatLazyContinuationTextResult<T, PMS>

  /**
   * Called after all other hooks in pre-match phase and before match phase start
   * @param state
   */
  eatEnd?: (state: PMS) => void

  /**
   * Check whether the `child` node is accepted as a child node of state:
   *  - `false`:  Rejected this child, and close current MatchState, then
   *              go back to the grandpa node
   *  - `true`:   Accept this child, then `beforeAcceptChild` will be called.
   */
  shouldAcceptChild?: (
    state: PMS,
    childState: BlockTokenizerPreMatchPhaseState,
  ) => boolean

  /**
   * Called before appending child
   */
  beforeAcceptChild?: (
    state: PMS,
    childState: BlockTokenizerPreMatchPhaseState,
  ) => void
}
