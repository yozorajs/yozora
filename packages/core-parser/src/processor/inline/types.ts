import type { RootMeta } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type {
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

/**
 * Processor for mapping phrasing contents to an array of YastToken.
 */
export interface PhrasingContentProcessor {
  /**
   * Process a phrasing contents in the range
   * [startIndexOfBlock, endIndexOfBlock) of nodePoints.
   *
   * @param startIndexOfBlock
   * @param endIndexOfBlock
   * @param nodePoints
   * @param meta
   */
  process(
    startIndexOfBlock: number,
    endIndexOfBlock: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: RootMeta,
  ): void

  /**
   * Perform cleaning operation and return the collected YastToken list.
   */
  done(): YastToken[]
}

/**
 * Processor for mapping YastTokenDelimiter to YastToken.
 */
export interface DelimiterProcessor {
  /**
   * Consuming a token delimiter.
   */
  process(hook: DelimiterProcessorHook, delimiter: YastTokenDelimiter): void

  /**
   *
   */
  done(): YastToken[]

  /**
   *
   */
  findLatestPairedDelimiter(
    hook: DelimiterProcessorHook,
    closerDelimiter: YastTokenDelimiter,
  ): YastTokenDelimiter | null
}

export interface DelimiterProcessorHook {
  name: string
  delimiterGroup: string
  delimiterPriority: number
  findDelimiter(startIndex: number): YastTokenDelimiter | null
  isDelimiterPair(
    openerDelimiter: YastTokenDelimiter,
    closerDelimiter: YastTokenDelimiter,
    higherPriorityInnerTokens: ReadonlyArray<YastToken>,
  ): ResultOfIsDelimiterPair
  processDelimiterPair(
    openerDelimiter: YastTokenDelimiter,
    closerDelimiter: YastTokenDelimiter,
    innerTokens: YastToken[],
  ): ResultOfProcessDelimiterPair
  processFullDelimiter(fullDelimiter: YastTokenDelimiter): YastToken | null
  reset(
    meta: RootMeta,
    nodePoints: ReadonlyArray<NodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ): void
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
