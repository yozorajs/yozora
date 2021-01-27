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
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   * @param meta
   * @param precedingNodePoint  the preceding character
   */
  findDelimiter: (
    startIndex: number,
    endIndex: number,
    precedingNodePoint: Readonly<EnhancedYastNodePoint> | null,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => TD | null

  /**
   * Process delimiter
   *
   * @param openerDelimiter
   * @param closerDelimiter
   * @param getInnerStates
   * @param nodePoints
   * @param meta
   */
  processDelimiter?: (
    openerDelimiter: TD,
    closerDelimiter: TD,
    getInnerStates: () => InlineTokenizerMatchPhaseState[],
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
 * Result type of InlineTokenizerMatchPhaseHook#processDelimiter
 * @see InlineTokenizerMatchPhaseHook
 */
export type ResultOfProcessDelimiter<
  T extends YastInlineNodeType = YastInlineNodeType,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  TD extends InlineTokenDelimiter = InlineTokenDelimiter> =
  | {
    state: MS
    remainOpenerDelimiter?: TD
    remainCloserDelimiter?: TD
  }
  | null
