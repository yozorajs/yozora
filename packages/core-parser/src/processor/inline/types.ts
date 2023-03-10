import type {
  IInlineToken,
  IResultOfIsDelimiterPair,
  IResultOfProcessDelimiterPair,
  IResultOfProcessSingleDelimiter,
  ITokenDelimiter,
} from '@yozora/core-tokenizer'

/**
 * Processor for mapping phrasing contents to an array of IInlineToken.
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
    higherPriorityTokens: ReadonlyArray<IInlineToken>,
    startIndex: number,
    endIndex: number,
  ): ReadonlyArray<IInlineToken>
}

/**
 * Processor for mapping ITokenDelimiter to IInlineToken.
 */
export interface IDelimiterProcessor {
  /**
   * Consuming a token delimiter.
   */
  process(hook: IDelimiterProcessorHook, delimiter: ITokenDelimiter): void

  /**
   * Complete the processing operation.
   */
  done(): ReadonlyArray<IInlineToken>

  /**
   * Reset processor.
   */
  reset(higherPriorityTokens: ReadonlyArray<IInlineToken>): void

  /**
   *
   */
  findNearestPairedDelimiter(
    hook: IDelimiterProcessorHook,
    closerDelimiter: ITokenDelimiter,
  ): ITokenDelimiter | null
}

export interface IDelimiterProcessorHook {
  name: string
  priority: number
  // [startIndex, endIndex]
  findDelimiter(rangeIndex: [number, number]): ITokenDelimiter | null | void
  isDelimiterPair(
    openerDelimiter: ITokenDelimiter,
    closerDelimiter: ITokenDelimiter,
    internalTokens: ReadonlyArray<IInlineToken>,
  ): IResultOfIsDelimiterPair
  processDelimiterPair(
    openerDelimiter: ITokenDelimiter,
    closerDelimiter: ITokenDelimiter,
    internalTokens: ReadonlyArray<IInlineToken>,
  ): IResultOfProcessDelimiterPair
  processSingleDelimiter(fullDelimiter: ITokenDelimiter): IResultOfProcessSingleDelimiter
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
  delimiter: ITokenDelimiter
  /**
   * Whether if this delimiter is no longer active.
   */
  inactive: boolean
  /**
   * Current top index of tokenStack.
   */
  tokenStackIndex: number
}
