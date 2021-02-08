import type { NodePoint } from '@yozora/character'
import type { YastMeta } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  ResultOfIsDelimiterPair,
  ResultOfProcessDelimiterPair,
} from './lifecycle/match'


export type DelimiterProcessor = {
  process: (hook: DelimiterProcessorHook, delimiter: InlineTokenDelimiter) => void
  done: () => InlineTokenizerMatchPhaseState[]
  findLatestPairedDelimiter: (
    hook: DelimiterProcessorHook,
    closerDelimiter: InlineTokenDelimiter
  ) => InlineTokenDelimiter | null
}


export type DelimiterProcessorHook = {
  name: string
  delimiterGroup: string
  delimiterPriority: number
  findDelimiter: (startIndex: number) => InlineTokenDelimiter | null
  isDelimiterPair: (
    openerDelimiter: InlineTokenDelimiter,
    closerDelimiter: InlineTokenDelimiter,
    higherPriorityInnerStates: ReadonlyArray<InlineTokenizerMatchPhaseState>,
  ) => ResultOfIsDelimiterPair
  processDelimiterPair: (
    openerDelimiter: InlineTokenDelimiter,
    closerDelimiter: InlineTokenDelimiter,
    innerStates: InlineTokenizerMatchPhaseState[]
  ) => ResultOfProcessDelimiterPair
  processFullDelimiter: (
    fullDelimiter: InlineTokenDelimiter,
  ) => InlineTokenizerMatchPhaseState | null
  reset: (
    meta: YastMeta,
    nodePoints: ReadonlyArray<NodePoint>,
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
