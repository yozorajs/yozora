import type { RootMeta, YastNodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type { YastToken, YastTokenDelimiter } from '../token'

/**
 * Hooks on the match-inline phase.
 */
export interface TokenizerMatchInlineHook<
  T extends YastNodeType = YastNodeType,
  Delimiter extends YastTokenDelimiter = YastTokenDelimiter,
  Token extends YastToken<T> = YastToken<T>,
  Meta extends RootMeta = RootMeta
> {
  /**
   * Priority of delimiter for handling tighter delimiter situations.
   *
   * For example: Inline code spans, links, images, and HTML tags group more
   * tightly than emphasis.
   *
   * @see https://github.github.com/gfm/#can-open-emphasis #rule17
   */
  readonly delimiterPriority: number

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
   * @param meta
   */
  findDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): ResultOfFindDelimiters<Delimiter>

  /**
   * Check if the given two delimiters can be combined into a pair.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param nodePoints
   * @param meta
   */
  isDelimiterPair?(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    higherPriorityInnerTokens: ReadonlyArray<YastToken>,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): ResultOfIsDelimiterPair

  /**
   * Process a pair of delimiters.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param innerTokens
   * @param nodePoints
   * @param meta
   */
  processDelimiterPair?(
    openerDelimiter: Delimiter,
    closerDelimiter: Delimiter,
    innerTokens: YastToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): ResultOfProcessDelimiterPair<T, Token, Delimiter>

  /**
   * Process a delimiter which type is `full` to a YastToken.
   *
   * @param fullDelimiter
   * @param nodePoints
   * @param meta
   */
  processFullDelimiter?(
    fullDelimiter: Delimiter,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): Token | null
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
  Token extends YastToken<T> = YastToken<T>,
  Delimiter extends YastTokenDelimiter = YastTokenDelimiter
> {
  token: Token | YastToken[]
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
  Token extends YastToken<T> = YastToken<T>
> = Token | null
