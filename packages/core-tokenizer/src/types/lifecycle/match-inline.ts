import type { Definition, YastNodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type {
  PartialYastInlineToken,
  YastInlineToken,
  YastTokenDelimiter,
} from '../token'

/**
 * Api in match-inline phase.
 */
export interface MatchInlinePhaseApi {
  /**
   * Get definition by identifier.
   * @param identifier
   */
  getDefinition(identifier: string): Omit<Definition, 'type'> | undefined
  /**
   * Resolve raw contents with the fallback inline tokenizer.
   * @param tokens
   * @param tokenStartIndex
   * @param tokenEndIndex
   * @param nodePoints
   */
  resolveFallbackTokens(
    tokens: ReadonlyArray<YastInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): YastInlineToken[]
}

/**
 * Hooks on the match-inline phase.
 */
export interface TokenizerMatchInlineHook<
  T extends YastNodeType = YastNodeType,
  Delimiter extends YastTokenDelimiter = YastTokenDelimiter,
  Token extends PartialYastInlineToken<T> = PartialYastInlineToken<T>
> {
  /**
   * Delimiter group name, designed to enhance the ability of
   * `invalidateOldDelimiters()` function, so that it can process delimiters
   * under the same group at the same time such as the links.
   *
   * @see https://github.github.com/gfm/#example-540
   * @see https://github.github.com/gfm/#example-541
   */
  readonly delimiterGroup: string

  /**
   * Find an inline token delimiter.
   *
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   * @param api
   */
  findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfFindDelimiters<Delimiter>

  /**
   * Check if the given two delimiters can be combined into a pair.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param nodePoints
   * @param api
   */
  isDelimiterPair?(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    higherPriorityInnerTokens: ReadonlyArray<YastInlineToken>,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfIsDelimiterPair

  /**
   * Process a pair of delimiters.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param innerTokens
   * @param nodePoints
   * @param api
   */
  processDelimiterPair?(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    innerTokens: YastInlineToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter>

  /**
   * Process a delimiter which type is `full` to a YastInlineToken.
   *
   * @param fullDelimiter
   * @param nodePoints
   * @param api
   */
  processFullDelimiter?(
    fullDelimiter: Delimiter,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessFullDelimiter<T, Token>
}

/**
 * Result of eatDelimiters.
 * @see TokenizerMatchInlineHook
 */
export type ResultOfFindDelimiters<Delimiter extends YastTokenDelimiter> =
  | Iterator<Delimiter, void, number>
  | (Delimiter | null)

/**
 * Result type of TokenizerMatchInlineHook#isDelimiterPair
 * @see TokenizerMatchInlineHook
 */
export type ResultOfIsDelimiterPair =
  | {
      paired: true // the given two delimiter are paired.
    }
  | {
      paired: false // the given two delimiter are not paired.
      opener: boolean // whether openerDelimiter is still a potential opener delimiter.
      closer: boolean // whether closerDelimiter is still a potential closer delimiter.
    }

/**
 * Result type of TokenizerMatchInlineHook#processDelimiterPair
 * @see TokenizerMatchInlineHook
 */
export interface ResultOfProcessDelimiterPair<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastInlineToken<T> = PartialYastInlineToken<T>,
  Delimiter extends YastTokenDelimiter = YastTokenDelimiter
> {
  token: Token | YastInlineToken[]
  remainOpenerDelimiter?: Delimiter
  remainCloserDelimiter?: Delimiter
  // Whether to inactivate all older unprocessed delimiters produced by
  // tokenizers that have the same group name as this tokenizer.
  shouldInactivateOlderDelimiters?: boolean
}

/**
 * Result type of TokenizerMatchInlineHook#processFullDelimiter
 * @see TokenizerMatchInlineHook
 */
export type ResultOfProcessFullDelimiter<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastInlineToken<T> = PartialYastInlineToken<T>
> = Token | null
