import type { NodeType } from '@yozora/ast'
import type { IPartialYastInlineToken, IYastInlineToken, IYastTokenDelimiter } from '../token'
import type { ITokenizer } from '../tokenizer'
import type { IMatchInlinePhaseApi } from './api'

export type IMatchInlineHookCreator<
  T extends NodeType = NodeType,
  IDelimiter extends IYastTokenDelimiter = IYastTokenDelimiter,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  IThis extends ITokenizer = ITokenizer,
> = (this: IThis, api: IMatchInlinePhaseApi) => IMatchInlineHook<T, IDelimiter, IToken>

/**
 * Hooks on the match-inline phase.
 */
export interface IMatchInlineHook<
  T extends NodeType = NodeType,
  IDelimiter extends IYastTokenDelimiter = IYastTokenDelimiter,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
> {
  /**
   * Find an inline token delimiter.
   */
  findDelimiter(): IResultOfFindDelimiters<IDelimiter>

  /**
   * Check if the given two delimiters can be combined into a pair.
   *
   * !!!note
   * The internalTokens may not fall exactly between the given
   * openerDelimiter and closerDelimiter, but they are guaranteed to be an
   * ordered list sorted by interval coordinates. The purpose of this design is
   * to reduce the slicing operation of the array and improve performance.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param internalTokens
   */
  isDelimiterPair?(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
  ): IResultOfIsDelimiterPair

  /**
   * Process a pair of delimiters.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param internalTokens
   */
  processDelimiterPair?(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter>

  /**
   * Process a single delimiter (its type should be one of 'both' and 'full')
   * which cannot find a paired delimiter in the previous doc positions.
   *
   * @param delimiter
   * @param api
   */
  processSingleDelimiter?(delimiter: IDelimiter): IResultOfProcessSingleDelimiter<T, IToken>
}

/**
 * Result of eatDelimiters.
 * @see IMatchInlineHook
 */
export type IResultOfFindDelimiters<IDelimiter extends IYastTokenDelimiter> = Iterator<
  IDelimiter | null,
  void,
  [number, number]
>

/**
 * Result type of IMatchInlineHook#isDelimiterPair
 * @see IMatchInlineHook
 */
export type IResultOfIsDelimiterPair =
  | {
      paired: true // the given two delimiter are paired.
    }
  | {
      paired: false // the given two delimiter are not paired.
      opener: boolean // whether openerDelimiter is still a potential opener delimiter.
      closer: boolean // whether closerDelimiter is still a potential closer delimiter.
    }

/**
 * Result type of IMatchInlineHook#processDelimiterPair
 * @see IMatchInlineHook
 */
export interface IResultOfProcessDelimiterPair<
  T extends NodeType = NodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  IDelimiter extends IYastTokenDelimiter = IYastTokenDelimiter,
> {
  tokens: ReadonlyArray<IToken | IYastInlineToken>
  remainOpenerDelimiter?: IDelimiter
  remainCloserDelimiter?: IDelimiter
}

/**
 * Result type of IMatchInlineHook#processFullDelimiter
 * @see IMatchInlineHook
 */
export type IResultOfProcessSingleDelimiter<
  T extends NodeType = NodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
> = IToken[]
