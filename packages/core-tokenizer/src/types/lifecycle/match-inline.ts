import type { YastNodeType } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type { IPartialYastInlineToken, IYastInlineToken, IYastTokenDelimiter } from '../token'

/**
 * Api in match-inline phase.
 */
export interface IMatchInlinePhaseApi {
  /**
   * Check if there is exists a definition with the given identifier.
   * @param identifier
   */
  hasDefinition(identifier: string): boolean

  /**
   * Check if there is exists a footnote definition with the given identifier.
   * @param identifier
   */
  hasFootnoteDefinition(identifier: string): boolean

  /**
   * Get the node points.
   */
  getNodePoints(): ReadonlyArray<INodePoint>

  /**
   * Start index of current block token.
   */
  getBlockStartIndex(): number

  /**
   * End index of current block token.
   */
  getBlockEndIndex(): number

  /**
   * Resolve fallback inline tokens
   *
   * @param tokens
   * @param tokenStartIndex
   * @param tokenEndIndex
   */
  resolveFallbackTokens(
    tokens: ReadonlyArray<IYastInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
  ): ReadonlyArray<IYastInlineToken>

  /**
   * Resolve raw contents with the fallback inline tokenizer.
   *
   * @param higherPriorityTokens
   * @param startIndex
   * @param endIndex
   */
  resolveInternalTokens(
    higherPriorityTokens: ReadonlyArray<IYastInlineToken>,
    startIndex: number,
    endIndex: number,
  ): ReadonlyArray<IYastInlineToken>
}

/**
 * Hooks on the match-inline phase.
 */
export interface ITokenizerMatchInlineHook<
  T extends YastNodeType = YastNodeType,
  IDelimiter extends IYastTokenDelimiter = IYastTokenDelimiter,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
> {
  /**
   * Find an inline token delimiter.
   *
   * @param api
   */
  findDelimiter(api: Readonly<IMatchInlinePhaseApi>): IResultOfFindDelimiters<IDelimiter>

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
   * @param api
   */
  isDelimiterPair?(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
    api: Readonly<IMatchInlinePhaseApi>,
  ): IResultOfIsDelimiterPair

  /**
   * Process a pair of delimiters.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param internalTokens
   * @param api
   */
  processDelimiterPair?(
    openerDelimiter: IDelimiter,
    closerDelimiter: IDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
    api: Readonly<IMatchInlinePhaseApi>,
  ): IResultOfProcessDelimiterPair<T, IToken, IDelimiter>

  /**
   * Process a single delimiter (its type should be one of 'both' and 'full')
   * which cannot find a paired delimiter in the previous doc positions.
   *
   * @param delimiter
   * @param api
   */
  processSingleDelimiter?(
    delimiter: IDelimiter,
    api: Readonly<IMatchInlinePhaseApi>,
  ): IResultOfProcessSingleDelimiter<T, IToken>
}

/**
 * Result of eatDelimiters.
 * @see ITokenizerMatchInlineHook
 */
export type IResultOfFindDelimiters<IDelimiter extends IYastTokenDelimiter> = Iterator<
  IDelimiter | null,
  void,
  [number, number]
>

/**
 * Result type of ITokenizerMatchInlineHook#isDelimiterPair
 * @see ITokenizerMatchInlineHook
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
 * Result type of ITokenizerMatchInlineHook#processDelimiterPair
 * @see ITokenizerMatchInlineHook
 */
export interface IResultOfProcessDelimiterPair<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
  IDelimiter extends IYastTokenDelimiter = IYastTokenDelimiter,
> {
  tokens: ReadonlyArray<IToken | IYastInlineToken>
  remainOpenerDelimiter?: IDelimiter
  remainCloserDelimiter?: IDelimiter
}

/**
 * Result type of ITokenizerMatchInlineHook#processFullDelimiter
 * @see ITokenizerMatchInlineHook
 */
export type IResultOfProcessSingleDelimiter<
  T extends YastNodeType = YastNodeType,
  IToken extends IPartialYastInlineToken<T> = IPartialYastInlineToken<T>,
> = IToken[]
