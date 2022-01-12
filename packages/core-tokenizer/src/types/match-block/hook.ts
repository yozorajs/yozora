import type { NodeType } from '@yozora/ast'
import type { IPhrasingContentLine } from '../phrasing-content'
import type { IPartialYastBlockToken, IYastBlockToken } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IMatchBlockPhaseApi } from './api'

export type IMatchBlockHookCreator<
  T extends NodeType = NodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
  IThis extends ITokenizer = ITokenizer,
> = (this: IThis, api: IMatchBlockPhaseApi) => IMatchBlockHook<T, IToken>

/**
 * Hooks on the match-block phase.
 */
export interface IMatchBlockHook<
  T extends NodeType = NodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
> {
  /**
   * Whether if it is a container block.
   */
  readonly isContainingBlock: boolean

  /**
   * Try to match new block data.
   *
   * @param line
   * @param parentToken
   * @see https://github.github.com/gfm/#phase-1-block-structure step2
   */
  eatOpener(
    line: Readonly<IPhrasingContentLine>,
    parentToken: Readonly<IYastBlockToken>,
  ): IResultOfEatOpener<T, IToken>

  /**
   * Try to interrupt the eatContinuationText action of the last sibling node.
   *
   * @param line
   * @param prevSiblingToken
   * @param parentToken
   */
  eatAndInterruptPreviousSibling?(
    line: Readonly<IPhrasingContentLine>,
    prevSiblingToken: Readonly<IYastBlockToken>,
    parentToken: Readonly<IYastBlockToken>,
  ): IResultOfEatAndInterruptPreviousSibling<T, IToken>

  /**
   * Try to eat the Continuation Text, and check if it is still satisfied
   * to current opening MatchToken, if matches, append to the previous
   * matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param line
   * @param token
   * @param parentToken
   * @see https://github.github.com/gfm/#phase-1-block-structure step1
   */
  eatContinuationText?(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
    parentToken: Readonly<IYastBlockToken>,
  ): IResultOfEatContinuationText

  /**
   * Try to eat the Laziness Continuation Text, and check if it is still
   * satisfied to current opening MatchToken, if matches, append to the
   * previous matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param line
   * @param token
   * @param parentToken
   * @see https://github.github.com/gfm/#phase-1-block-structure step3
   */
  eatLazyContinuationText?(
    line: Readonly<IPhrasingContentLine>,
    token: IToken,
    parentToken: Readonly<IYastBlockToken>,
  ): IResultOfEatLazyContinuationText

  /**
   * Called when the token is saturated.
   * @param token
   */
  onClose?(token: IToken): IResultOfOnClose
}

/**
 * # Returned on success
 *    => {
 *      token: IToken
 *      nextIndex: number
 *      saturated?: boolean
 *    }
 *
 *  * token: intermediate token data during the match phase
 *  * nextIndex: next match position (index of nodePoints)
 *  * saturated: whether the matching has been completed
 *
 * # Returned on Failure
 *    => null
 *
 * @see IMatchBlockHook.eatOpener
 */
export type IResultOfEatOpener<
  T extends NodeType = NodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
> = {
  token: IToken
  nextIndex: number
  saturated?: boolean
} | null

/**
 * # Returned on success
 *    => {
 *      token: IToken
 *      nextIndex: number
 *      saturated?: true
 *      shouldRemovePreviousSibling?: boolean
 *    }
 *
 *  * token: intermediate token data during the match phase
 *  * nextIndex: next match position (index of nodePoints)
 *  * saturated: whether the matching has been completed
 *  * shouldRemovePreviousSibling:
 *    - *true*:  Replace the previous sibling token with the new returned token
 *    - *false*: Keep the previous sibling token and append the new returned
 *               token after the previous sibling token
 *
 *  * failure => null
 *
 * @see IMatchBlockHook.eatAndInterruptPreviousSibling
 */
export type IResultOfEatAndInterruptPreviousSibling<
  T extends NodeType = NodeType,
  IToken extends IPartialYastBlockToken<T> = IPartialYastBlockToken<T>,
> = {
  token: IToken
  nextIndex: number
  saturated?: boolean
  remainingSibling: IYastBlockToken[] | IYastBlockToken | null
} | null

/**
 * @see IMatchBlockHook
 */
export type IResultOfEatContinuationText =
  | {
      // Match failed, and the whole token should be destroyed and rollback.
      status: 'failedAndRollback'
      lines: IPhrasingContentLine[]
    }
  | {
      // Match failed, but only the last lines should be rollback.
      status: 'closingAndRollback'
      lines: IPhrasingContentLine[]
    }
  | {
      // Match failed, but there may be some lazy continuation text exists.
      status: 'notMatched'
    }
  | {
      // Match succeed, and current token is ready to be closed.
      status: 'closing'
      nextIndex: number
    }
  | {
      // Match succeed, and current token is still in opening.
      status: 'opening'
      nextIndex: number
    }

/**
 * @see IMatchBlockHook.eatLazyContinuationText
 */
export type IResultOfEatLazyContinuationText =
  | {
      status: 'notMatched'
    }
  | {
      status: 'opening'
      nextIndex: number
    }

/**
 * @see IMatchBlockHook
 */
export type IResultOfOnClose =
  | {
      // Match failed, and the whole token should be destroyed and rollback.
      status: 'failedAndRollback'
      lines: IPhrasingContentLine[]
    }
  | {
      // Match failed, but only the last lines should be rollback.
      status: 'closingAndRollback'
      lines: IPhrasingContentLine[]
    }
  | void
