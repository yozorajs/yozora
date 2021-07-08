import type { NodePoint } from '@yozora/character'
import type {
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  ResultOfProcessSingleDelimiter,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

/**
 * Processor for mapping phrasing contents to an array of YastInlineToken.
 */
export interface PhrasingContentProcessor {
  /**
   * Process a phrasing contents in the range
   * [startIndexOfBlock, endIndexOfBlock) of nodePoints.
   *
   * @param higherPriorityTokens
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   */
  process(
    higherPriorityTokens: ReadonlyArray<YastInlineToken>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ReadonlyArray<YastInlineToken>
}

/**
 * Processor for mapping YastTokenDelimiter to YastInlineToken.
 */
export interface DelimiterProcessor {
  /**
   * Consuming a token delimiter.
   */
  process(hook: DelimiterProcessorHook, delimiter: YastTokenDelimiter): void

  /**
   * Complete the processing operation.
   */
  done(): ReadonlyArray<YastInlineToken>

  /**
   * Reset processor.
   */
  reset(higherPriorityTokens: ReadonlyArray<YastInlineToken>): void

  /**
   *
   */
  findNearestPairedDelimiter(
    hook: DelimiterProcessorHook,
    closerDelimiter: YastTokenDelimiter,
  ): YastTokenDelimiter | null
}

export interface DelimiterProcessorHook {
  name: string
  priority: number
  // [startIndex, endIndex]
  findDelimiter(rangeIndex: [number, number]): YastTokenDelimiter | null | void
  isDelimiterPair(
    openerDelimiter: YastTokenDelimiter,
    closerDelimiter: YastTokenDelimiter,
    internalTokens: ReadonlyArray<YastInlineToken>,
  ): ResultOfIsDelimiterPair
  processDelimiterPair(
    openerDelimiter: YastTokenDelimiter,
    closerDelimiter: YastTokenDelimiter,
    internalTokens: ReadonlyArray<YastInlineToken>,
  ): ResultOfProcessDelimiterPair
  processSingleDelimiter(
    fullDelimiter: YastTokenDelimiter,
  ): ResultOfProcessSingleDelimiter
  reset(nodePoints: ReadonlyArray<NodePoint>): void
}

/**
 *
 */
export interface DelimiterItem {
  /**
   * Hook which produce this delimiter.
   */
  hook: DelimiterProcessorHook
  /**
   * Inline token delimiter.
   */
  delimiter: YastTokenDelimiter
  /**
   * Whether if this delimiter is no longer active.
   */
  inactive: boolean
  /**
   * Current top index of tokenStack.
   */
  tokenStackIndex: number
}
