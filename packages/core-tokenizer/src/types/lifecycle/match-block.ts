import type { YastNodeType } from '@yozora/ast'
import type {
  PhrasingContentLine,
  PhrasingContentToken,
} from '../phrasing-content'
import type { PartialYastBlockToken, YastBlockToken } from '../token'

/**
 * Api in match-block phase.
 */
export interface MatchBlockPhaseApi {
  /**
   * Extract phrasing content lines from block token.
   * @param token
   */
  extractPhrasingLines(
    token: YastBlockToken,
  ): ReadonlyArray<PhrasingContentLine> | null
  /**
   * Build PhrasingContentToken from phrasing content lines.
   * @param lines
   */
  buildPhrasingContentToken(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentToken | null
  /**
   * Re-match token from phrasing content lines.
   * @param lines
   * @param originalToken
   */
  rollbackPhrasingLines(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalToken?: Readonly<YastBlockToken>,
  ): YastBlockToken[]
}

/**
 * Hooks on the match-block phase.
 */
export interface TokenizerMatchBlockHook<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastBlockToken<T> = PartialYastBlockToken<T>,
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
    line: Readonly<PhrasingContentLine>,
    parentToken: Readonly<YastBlockToken>,
  ): ResultOfEatOpener<T, Token>

  /**
   * Try to interrupt the eatContinuationText action of the last sibling node.
   *
   * @param line
   * @param prevSiblingToken
   * @param parentToken
   * @param api
   */
  eatAndInterruptPreviousSibling?(
    line: Readonly<PhrasingContentLine>,
    prevSiblingToken: Readonly<YastBlockToken>,
    parentToken: Readonly<YastBlockToken>,
    api: Readonly<MatchBlockPhaseApi>,
  ): ResultOfEatAndInterruptPreviousSibling<T, Token>

  /**
   * Try to eat the Continuation Text, and check if it is still satisfied
   * to current opening MatchToken, if matches, append to the previous
   * matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param line
   * @param token
   * @param parentToken
   * @param api
   * @see https://github.github.com/gfm/#phase-1-block-structure step1
   */
  eatContinuationText?(
    line: Readonly<PhrasingContentLine>,
    token: Token,
    parentToken: Readonly<YastBlockToken>,
    api: Readonly<MatchBlockPhaseApi>,
  ): ResultOfEatContinuationText

  /**
   * Try to eat the Laziness Continuation Text, and check if it is still
   * satisfied to current opening MatchToken, if matches, append to the
   * previous matching content.
   * In the returned data, nextIndex is only valid if isMatched is true.
   *
   * @param line
   * @param token
   * @param parentToken
   * @param api
   * @see https://github.github.com/gfm/#phase-1-block-structure step3
   */
  eatLazyContinuationText?(
    line: Readonly<PhrasingContentLine>,
    token: Token,
    parentToken: Readonly<YastBlockToken>,
    api: Readonly<MatchBlockPhaseApi>,
  ): ResultOfEatLazyContinuationText

  /**
   * Called when the token is saturated.
   * @param token
   * @param api
   */
  onClose?(token: Token, api: Readonly<MatchBlockPhaseApi>): ResultOfOnClose

  /**
   * Extract array of PhrasingContentLine from a given YastBlockToken.
   * @param token
   */
  extractPhrasingContentLines?(
    token: Readonly<Token>,
  ): ReadonlyArray<PhrasingContentLine> | null

  /**
   * Build BlockTokenizerPostMatchPhaseToken from
   * a PhrasingContentMatchPhaseToken.
   * @param lines
   * @param originalToken
   */
  buildBlockToken?(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalToken: Token,
  ): (Token & YastBlockToken) | null
}

/**
 * # Returned on success
 *    => {
 *      token: Token
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
 * @see TokenizerMatchBlockHook.eatOpener
 */
export type ResultOfEatOpener<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastBlockToken<T> = PartialYastBlockToken<T>,
> = {
  token: Token
  nextIndex: number
  saturated?: boolean
} | null

/**
 * # Returned on success
 *    => {
 *      token: Token
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
 * @see TokenizerMatchBlockHook.eatAndInterruptPreviousSibling
 */
export type ResultOfEatAndInterruptPreviousSibling<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastBlockToken<T> = PartialYastBlockToken<T>,
> = {
  token: Token
  nextIndex: number
  saturated?: boolean
  remainingSibling: YastBlockToken[] | YastBlockToken | null
} | null

/**
 * @see TokenizerMatchBlockHook
 */
export type ResultOfEatContinuationText =
  | {
      // Match failed, and the whole token should be destroyed and rollback.
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
      // Match failed, and the whole token should be destroyed and rollback.
      status: 'failedAndRollback'
      lines: PhrasingContentLine[]
    }
  | {
      // Match failed, but only the last lines should be rollback.
      status: 'closingAndRollback'
      lines: PhrasingContentLine[]
    }
  | void
