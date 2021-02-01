import type {
  EnhancedYastNodePoint,
  YastMeta,
  YastNodeInterval,
} from '@yozora/tokenizercore'
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
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   * @param meta
   */
  findDelimiter: (
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => ResultOfFindDelimiters<TD>

  /**
   * Process delimiter
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param innerStates
   * @param nodePoints
   * @param meta
   * @param inactivePreviousDelimiters
   */
  processDelimiter?: (
    openerDelimiter: TD,
    closerDelimiter: TD,
    innerStates: InlineTokenizerMatchPhaseState[],
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => ResultOfProcessDelimiter<T, MS, TD>

  /**
   * Process a delimiter which type is `full` to a MatchPhaseState.
   *
   * @param fullDelimiter
   * @param nodePoints
   * @param meta
   */
  processFullDelimiter?: (
    fullDelimiter: TD,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => MS | null
}


/**
 * State of match phase
 */
export interface InlineTokenizerMatchPhaseState<
  T extends YastInlineNodeType = YastInlineNodeType>
  extends YastNodeInterval {
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
export interface InlineTokenDelimiter extends YastNodeInterval {
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
 * Result type of InlineTokenizerMatchPhaseHook#processDelimiter
 * @see InlineTokenizerMatchPhaseHook
 */
export type ResultOfProcessDelimiter<
  T extends YastInlineNodeType = YastInlineNodeType,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  TD extends InlineTokenDelimiter = InlineTokenDelimiter> =
  | {
    status: 'paired'
    state: MS | InlineTokenizerMatchPhaseState[]
    remainOpenerDelimiter?: TD
    remainCloserDelimiter?: TD
    // Inactivate all older unprocessed delimiters produced by this tokenizer.
    shouldInactivateOlderDelimiters?: boolean
  }
  | {
    status: 'unpaired'
    remainOpenerDelimiter?: TD
    remainCloserDelimiter?: TD
  }

export type ResultOfProcessFullDelimiter<
  T extends YastInlineNodeType = YastInlineNodeType,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>> =
  | MS
  | null
