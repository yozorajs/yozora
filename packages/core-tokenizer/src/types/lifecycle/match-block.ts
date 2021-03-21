import type { YastNodePosition } from '@yozora/ast'
import type { PhrasingContentLine } from '../phrasing-content'

/**
 * Hooks on the match-block phase.
 */
export interface TokenizerMatchBlockHook<
  T extends string = string,
  State extends YastBlockState<T> = YastBlockState<T>
> {
  /**
   * Whether if it is a container block.
   */
  readonly isContainerBlock: boolean

  /**
   * Specify an array of YastNode types that can be interrupted by this
   * Tokenizer on match phase.
   */
  readonly interruptableTypes: ReadonlyArray<string>

  /**
   * Try to match new block data.
   *
   * @param line
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step2
   */
  eatOpener(
    line: Readonly<PhrasingContentLine>,
    parentState: Readonly<YastBlockState>,
  ): ResultOfEatOpener<T, State>

  /**
   * Try to interrupt the eatContinuationText action of the last sibling node.
   *
   * @param line
   * @param previousSiblingState
   * @param parentState
   */
  eatAndInterruptPreviousSibling?(
    line: Readonly<PhrasingContentLine>,
    previousSiblingState: Readonly<YastBlockState>,
    parentState: Readonly<YastBlockState>,
  ): ResultOfEatAndInterruptPreviousSibling<T, State>

  /**
   * Try to eat the Continuation Text, and check if it is still satisfied
   * to current opening MatchState, if matches, append to the previous
   * matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param line
   * @param state
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step1
   */
  eatContinuationText?(
    line: Readonly<PhrasingContentLine>,
    state: State,
    parentState: Readonly<YastBlockState>,
  ): ResultOfEatContinuationText

  /**
   * Try to eat the Laziness Continuation Text, and check if it is still
   * satisfied to current opening MatchState, if matches, append to the
   * previous matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param line
   * @param state
   * @param parentState
   * @see https://github.github.com/gfm/#phase-1-block-structure step3
   */
  eatLazyContinuationText?(
    line: Readonly<PhrasingContentLine>,
    state: State,
    parentState: Readonly<YastBlockState>,
  ): ResultOfEatLazyContinuationText

  /**
   * Called when the state is saturated.
   * @param state
   */
  onClose?(state: State): ResultOfOnClose

  /**
   * Extract array of PhrasingContentLine from a given YastBlockState.
   * @param state
   */
  extractPhrasingContentLines?(
    state: Readonly<State>,
  ): ReadonlyArray<PhrasingContentLine> | null

  /**
   * Build BlockTokenizerPostMatchPhaseState from
   * a PhrasingContentMatchPhaseState.
   * @param lines
   * @param originalState
   */
  buildBlockState?(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalState: State,
  ): State | null
}

/**
 * Middle state on match phase of Tokenizer.
 */
export interface YastBlockState<T extends string = string> {
  /**
   * Type of a state.
   */
  type: T
  /**
   * Location of a node in the source contents.
   */
  position: YastNodePosition
  /**
   * List of child node of current state node
   */
  children?: YastBlockState[]
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
 * @see TokenizerMatchBlockHook.eatOpener
 */
export type ResultOfEatOpener<
  T extends string = string,
  MS extends YastBlockState<T> = YastBlockState<T>
> = {
  state: MS
  nextIndex: number
  saturated?: boolean
} | null

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
 *    - *false*: Keep the previous sibling state and append the new returned
 *               state after the previous sibling state
 *
 *  * failure => null
 *
 * @see TokenizerMatchBlockHook.eatAndInterruptPreviousSibling
 */
export type ResultOfEatAndInterruptPreviousSibling<
  T extends string = string,
  MS extends YastBlockState<T> = YastBlockState<T>
> = {
  state: MS
  nextIndex: number
  saturated?: boolean
  remainingSibling: YastBlockState | null
} | null

/**
 * @see TokenizerMatchBlockHook
 */
export type ResultOfEatContinuationText =
  | {
      // Match failed, and the whole state should be destroyed and rollback.
      status: 'failedAndRollback'
      lines: PhrasingContentLine[]
    }
  | {
      // Match failed, but only the last lines should be rollback.
      status: 'closingAndRollback'
      lines: PhrasingContentLine[]
    }
  | {
      // Match failed, but there may be some lazy continuation text exists.
      status: 'notMatched'
    }
  | {
      // Match succeed, and current state is ready to be closed.
      status: 'closing'
      nextIndex: number
    }
  | {
      // Match succeed, and current state is still in opening.
      status: 'opening'
      nextIndex: number
    }

/**
 * @see TokenizerMatchBlockHook.eatLazyContinuationText
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
 * @see TokenizerMatchBlockHook
 */
export type ResultOfOnClose =
  | {
      // Match failed, and the whole state should be destroyed and rollback.
      status: 'failedAndRollback'
      lines: PhrasingContentLine[]
    }
  | {
      // Match failed, but only the last lines should be rollback.
      status: 'closingAndRollback'
      lines: PhrasingContentLine[]
    }
  | void
