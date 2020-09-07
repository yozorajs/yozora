import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import { BlockDataNodeType } from '../base'
import { PhrasingContentLine } from '../phrasing'


/**
 *
 */
export interface BlockTokenizerEatingInfo {
  /**
   * 当前行剩余内容起始的下标
   * The starting index of the rest of the current line
   */
  startIndex: number
  /**
   * 当前行结束的下标
   * The ending index of the rest of the current line
   */
  endIndex: number
  /**
   * 当前行剩余内容第一个非空白字符的下标
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhiteSpaceIndex: number
  /**
   * 当前行剩余内容是否为空行
   * Whether the remaining content of the current line is blank
   */
  isBlankLine: boolean
  /**
   * Line no of current line
   */
  lineNo: number
}


/**
 * Result data type of {BlockTokenizerPreMatchPhaseHook.eat}
 *
 * * `null`: Not a valid marker of DataNode recognized by this tokenizer
 */
export type BlockTokenizerEatNewMarkerResult<
  T extends BlockDataNodeType,
  PMS extends BlockTokenizerPreMatchPhaseState<T>> =
  | {
    state: PMS,
    nextIndex: number,
    nextState?: BlockTokenizerPreMatchPhaseState
  }
  | null


/**
 * Result data type of {BlockTokenizerPreMatchPhaseHook.eatContinuationText}
 *
 * * `null`: Not a valid Continuation Text of current DataNode
 *
 * * `resultType='continue'`:
 *
 *   - nextIndex: next eat position
 *   - saturated: Whether the current node is saturated, if true,
 *     ready to close it
 *
 * * `resultType='replace'`: abandon current state and to construct a state
 *                           of fallback Tokenizer
 *
 *   - nextIndex: next eat position
 *   - opening:
 *   - lines:
 */
export type BlockTokenizerEatContinuationResult =
  | {
    resultType: 'continue'
    nextIndex: number
    saturated: boolean
  }
  | {
    resultType: 'replace'
    nextIndex: number
    opening: boolean
    lines: PhrasingContentLine[]
  }
  | null


/**
 * Result data type of {BlockTokenizerPreMatchPhaseHook.eatAndInterruptPreviousSibling}
 *
 * * `null`:
 *
 * *
 *   if the interruption is successful, and the value of shouldRemovePreviousSibling is:
 *     true:  Replace the previous sibling node; delete the last previous
 *            node from the parent element
 *     false: Keep the previous sibling node and append the current node
 *            after the previous sibling node
 */
export type BlockTokenizerEatAndInterruptResult<
  T extends BlockDataNodeType,
  PMS extends BlockTokenizerPreMatchPhaseState<T>> =
  | {
    nextIndex: number,
    state: PMS,
    shouldRemovePreviousSibling: boolean,
    nextState?: BlockTokenizerPreMatchPhaseState
  }
  | null


/**
 * Result data type of {BlockTokenizerPreMatchPhaseHook.eatLazyContinuationText}
 *
 *
 * * `null`: Not a valid LazyContinuation Text of current DataNode
 *
 * * `{nextIndex: number, saturated: boolean}:
 *
 *   - nextIndex: next eat position
 *   - saturated: Whether the current node is saturated, if true, ready to close it
 */
export type BlockTokenizerLazyContinuationResult =
  | {
    nextIndex: number,
    saturated: boolean
  }
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
   * 是否处于开放（可修改）状态
   * Is it in an opening (modifiable) state
   * @see https://github.github.com/gfm/#phase-1-block-structure
   */
  opening: boolean
  /**
   * 父节点
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
   * In the returned data, nextIndex is only valid when BlockDataNodeMatchResult
   * is not null/undefined.
   *
   * @param codePositions
   * @param eatingInfo
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step2
   */
  eatNewMarker: (
    codePositions: DataNodeTokenPointDetail[],
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ) => BlockTokenizerEatNewMarkerResult<T, PMS>

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
    eatingInfo: BlockTokenizerEatingInfo,
    parentState: Readonly<BlockTokenizerPreMatchPhaseState>,
    previousSiblingState: Readonly<BlockTokenizerPreMatchPhaseState>,
  ) => BlockTokenizerEatAndInterruptResult<T, PMS>

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
    eatingInfo: BlockTokenizerEatingInfo,
    state: PMS,
  ) => BlockTokenizerEatContinuationResult

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
    eatingInfo: BlockTokenizerEatingInfo,
    state: PMS,
  ) => BlockTokenizerLazyContinuationResult

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
