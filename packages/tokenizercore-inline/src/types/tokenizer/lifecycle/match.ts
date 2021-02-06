import type { NodeInterval, NodePoint } from '@yozora/character'
import type { YastMeta } from '@yozora/tokenizercore'
import type { YastInlineNodeType } from '../../node'


/**
 * Hooks in the match phase
 */
export interface InlineTokenizerMatchPhaseHook<
  T extends YastInlineNodeType = YastInlineNodeType,
  M extends YastMeta = YastMeta,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  TD extends InlineTokenDelimiter = InlineTokenDelimiter,
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
   * invalidateOldDelimiters function, so that it can process delimiters under
   * the same group at the same time such as the links.
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
  findDelimiter: (
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => ResultOfFindDelimiters<TD>

  /**
   * Check if the given two delimiters can be combined into a pair.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param nodePoints
   * @param meta
   */
  isDelimiterPair?: (
    openerDelimiter: TD,
    closerDelimiter: TD,
    higherPriorityInnerStates: ReadonlyArray<InlineTokenizerMatchPhaseState>,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => ResultOfIsDelimiterPair

  /**
   * Process a pair of delimiters.
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param innerStates
   * @param nodePoints
   * @param meta
   */
  processDelimiterPair?: (
    openerDelimiter: TD,
    closerDelimiter: TD,
    innerStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => ResultOfProcessDelimiterPair<T, MS, TD>

  /**
   * Process a delimiter which type is `full` to a MatchPhaseState.
   *
   * @param fullDelimiter
   * @param nodePoints
   * @param meta
   */
  processFullDelimiter?: (
    fullDelimiter: TD,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => MS | null
}


/**
 * State of match phase
 */
export interface InlineTokenizerMatchPhaseState<
  T extends YastInlineNodeType = YastInlineNodeType>
  extends NodeInterval {
  /**
   * Type of match phase state
   */
  type: T
  /**
   * List of child node of current state node.
   */
  children?: InlineTokenizerMatchPhaseState[]
}


/**
 * Token delimiter.
 */
export interface InlineTokenDelimiter extends NodeInterval {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer' | 'both' | 'full'
}


/**
 * Result of eatDelimiters.
 * @see InlineTokenizerMatchPhaseHook
 */
export type ResultOfFindDelimiters<TD extends InlineTokenDelimiter = InlineTokenDelimiter> =
  | Iterator<TD, void, number>
  | (TD | null)


/**
 * Result type of InlineTokenizerMatchPhaseHook#isDelimiterPair
 * @see InlineTokenizerMatchPhaseHook
 */
export type ResultOfIsDelimiterPair =
  | {
    paired: true    // the given two delimiter are paired.
  }
  | {
    paired: false   // the given two delimiter are not paired.
    opener: boolean // whether openerDelimiter is still a potential opener delimiter.
    closer: boolean // whether closerDelimiter is still a potential closer delimiter.
  }


/**
 * Result type of InlineTokenizerMatchPhaseHook#processDelimiterPair
 * @see InlineTokenizerMatchPhaseHook
 */
export type ResultOfProcessDelimiterPair<
  T extends YastInlineNodeType = YastInlineNodeType,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  TD extends InlineTokenDelimiter = InlineTokenDelimiter> =
  | {
    state: MS | InlineTokenizerMatchPhaseState[]
    remainOpenerDelimiter?: TD
    remainCloserDelimiter?: TD
    // Whether to inactivate all older unprocessed delimiters produced by
    // tokenizers that have the same group name as this tokenizer.
    shouldInactivateOlderDelimiters?: boolean
  }

export type ResultOfProcessFullDelimiter<
  T extends YastInlineNodeType = YastInlineNodeType,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>> =
  | MS
  | null
