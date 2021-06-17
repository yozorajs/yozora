import type { YastNodeType } from '@yozora/ast'
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
   * @param nodePoints
   */
  resolveFallbackInlineTokens(
    tokens: ReadonlyArray<YastInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): YastInlineToken[]
  /**
   * Resolve raw contents with the fallback inline tokenizer.
   *
   * @param higherPriorityTokens
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   */
  resolveInnerTokens(
    higherPriorityTokens: ReadonlyArray<YastInlineToken>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): YastInlineToken[]
}

/**
 * Hooks on the match-inline phase.
 */
export interface TokenizerMatchInlineHook<
  T extends YastNodeType = YastNodeType,
  Delimiter extends YastTokenDelimiter = YastTokenDelimiter,
  Token extends PartialYastInlineToken<T> = PartialYastInlineToken<T>,
> {
  /**
   * Find an inline token delimiter.
   *
   * @param nodePoints
   * @param api
   */
  findDelimiter(
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
   * Process a single delimiter (its type should be one of 'both' and 'full')
   * which cannot find a paired delimiter in the previous doc positions.
   *
   * @param delimiter
   * @param nodePoints
   * @param api
   */
  processSingleDelimiter?(
    delimiter: Delimiter,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): ResultOfProcessSingleDelimiter<T, Token>
}

/**
 * Result of eatDelimiters.
 * @see TokenizerMatchInlineHook
 */
export type ResultOfFindDelimiters<Delimiter extends YastTokenDelimiter> =
  Iterator<Delimiter | null, void, [number, number]>

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
  Delimiter extends YastTokenDelimiter = YastTokenDelimiter,
> {
  tokens: Array<Token | YastInlineToken>
  remainOpenerDelimiter?: Delimiter
  remainCloserDelimiter?: Delimiter
}

/**
 * Result type of TokenizerMatchInlineHook#processFullDelimiter
 * @see TokenizerMatchInlineHook
 */
export type ResultOfProcessSingleDelimiter<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastInlineToken<T> = PartialYastInlineToken<T>,
> = Token[]
