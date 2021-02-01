import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  ResultOfProcessDelimiter,
} from '../types/tokenizer/lifecycle/match'


export type DelimiterProcessorHook = {
  name: string

  delimiterPriority: number

  findDelimiter: (startIndex: number) => InlineTokenDelimiter | null

  processDelimiter: (
    openerDelimiter: InlineTokenDelimiter,
    closerDelimiter: InlineTokenDelimiter,
    innerStates: InlineTokenizerMatchPhaseState[]
  ) => ResultOfProcessDelimiter

  processFullDelimiter: (
    fullDelimiter: InlineTokenDelimiter,
  ) => InlineTokenizerMatchPhaseState | null

  reset: (
    meta: YastMeta,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ) => void
}


export type DelimiterItem = {
  /**
   * Hook which produce this delimiter.
   */
  hook: DelimiterProcessorHook
  /**
   * Inline token delimiter.
   */
  delimiter: InlineTokenDelimiter
  /**
   * Whether if this delimiter is no longer active.
   */
  inactive: boolean
  /**
   * Current top index of stateStack.
   */
  stateStackIndex: number
}
