import type { NodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  PartialYastInlineToken,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
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
   * @param startIndexOfBlock
   * @param endIndexOfBlock
   * @param nodePoints
   * @param api
   */
  process(
    startIndexOfBlock: number,
    endIndexOfBlock: number,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): void

  /**
   * Perform cleaning operation and return the collected YastInlineToken list.
   */
  done(): YastInlineToken[]
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
   *
   */
  done(): YastInlineToken[]

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
  delimiterGroup: string
  priority: number
  findDelimiter(startIndex: number): YastTokenDelimiter | null
  isDelimiterPair(
    openerDelimiter: YastTokenDelimiter,
    closerDelimiter: YastTokenDelimiter,
    higherPriorityInnerTokens: ReadonlyArray<YastInlineToken>,
  ): ResultOfIsDelimiterPair
  processDelimiterPair(
    openerDelimiter: YastTokenDelimiter,
    closerDelimiter: YastTokenDelimiter,
    innerTokens: YastInlineToken[],
  ): ResultOfProcessDelimiterPair
  processFullDelimiter(
    fullDelimiter: YastTokenDelimiter,
  ): PartialYastInlineToken | null
  reset(
    _matchInlineApi: Readonly<MatchInlinePhaseApi>,
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
