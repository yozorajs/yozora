import type {
  IResultOfIsDelimiterPair,
  IResultOfProcessDelimiterPair,
  IResultOfProcessSingleDelimiter,
  IYastInlineToken,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

/**
 * Processor for mapping phrasing contents to an array of IYastInlineToken.
 */
export interface IPhrasingContentProcessor {
  /**
   * Process a phrasing contents in the range
   * [startIndexOfBlock, endIndexOfBlock) of nodePoints.
   *
   * @param higherPriorityTokens
   * @param startIndex
   * @param endIndex
   */
  process(
    higherPriorityTokens: ReadonlyArray<IYastInlineToken>,
    startIndex: number,
    endIndex: number,
  ): ReadonlyArray<IYastInlineToken>
}

/**
 * Processor for mapping IYastTokenDelimiter to IYastInlineToken.
 */
export interface IDelimiterProcessor {
  /**
   * Consuming a token delimiter.
   */
  process(hook: IDelimiterProcessorHook, delimiter: IYastTokenDelimiter): void

  /**
   * Complete the processing operation.
   */
  done(): ReadonlyArray<IYastInlineToken>

  /**
   * Reset processor.
   */
  reset(higherPriorityTokens: ReadonlyArray<IYastInlineToken>): void

  /**
   *
   */
  findNearestPairedDelimiter(
    hook: IDelimiterProcessorHook,
    closerDelimiter: IYastTokenDelimiter,
  ): IYastTokenDelimiter | null
}

export interface IDelimiterProcessorHook {
  name: string
  priority: number
  // [startIndex, endIndex]
  findDelimiter(rangeIndex: [number, number]): IYastTokenDelimiter | null | void
  isDelimiterPair(
    openerDelimiter: IYastTokenDelimiter,
    closerDelimiter: IYastTokenDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
  ): IResultOfIsDelimiterPair
  processDelimiterPair(
    openerDelimiter: IYastTokenDelimiter,
    closerDelimiter: IYastTokenDelimiter,
    internalTokens: ReadonlyArray<IYastInlineToken>,
  ): IResultOfProcessDelimiterPair
  processSingleDelimiter(
    fullDelimiter: IYastTokenDelimiter,
  ): IResultOfProcessSingleDelimiter
  reset(): void
}

/**
 *
 */
export interface IDelimiterItem {
  /**
   * Hook which produce this delimiter.
   */
  hook: IDelimiterProcessorHook
  /**
   * Inline token delimiter.
   */
  delimiter: IYastTokenDelimiter
  /**
   * Whether if this delimiter is no longer active.
   */
  inactive: boolean
  /**
   * Current top index of tokenStack.
   */
  tokenStackIndex: number
}
