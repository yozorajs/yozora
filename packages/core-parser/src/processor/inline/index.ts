import type { NodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  Tokenizer,
  TokenizerMatchInlineHook,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import { createMultiPriorityDelimiterProcessor } from './multiple-priority'
import type {
  DelimiterItem,
  DelimiterProcessorHook,
  PhrasingContentProcessor,
} from './types'

/**
 *
 */
export function createPhrasingContentProcessor(
  matchPhaseHooks: ReadonlyArray<Tokenizer & TokenizerMatchInlineHook>,
): PhrasingContentProcessor {
  const hooks: DelimiterProcessorHook[] = matchPhaseHooks.map(
    (hook): DelimiterProcessorHook => {
      let api: Readonly<MatchInlinePhaseApi>
      let nodePoints: ReadonlyArray<NodePoint>
      let endIndexOfBlock: number
      let lastDelimiter: YastTokenDelimiter | null
      let lastStartIndex: number
      const delimiterIndexStack: number[] = []
      let _findDelimiter: (startIndex: number) => YastTokenDelimiter | null

      return {
        name: hook.name,
        delimiterGroup: hook.delimiterGroup || hook.name,
        priority: hook.priority,
        findDelimiter: function (startIndex) {
          if (lastStartIndex >= startIndex) return lastDelimiter
          lastDelimiter = _findDelimiter(startIndex)
          lastStartIndex =
            lastDelimiter == null ? endIndexOfBlock : lastDelimiter.startIndex
          return lastDelimiter
        },
        isDelimiterPair: (
          openerDelimiter,
          closerDelimiter,
          higherPriorityInnerTokens,
        ) =>
          hook.isDelimiterPair!(
            openerDelimiter,
            closerDelimiter,
            higherPriorityInnerTokens,
            nodePoints,
            api,
          ),
        processDelimiterPair: (openerDelimiter, closerDelimiter, innerTokens) =>
          hook.processDelimiterPair!(
            openerDelimiter,
            closerDelimiter,
            innerTokens,
            nodePoints,
            api,
          ),
        processFullDelimiter: fullDelimiter =>
          hook.processFullDelimiter!(fullDelimiter, nodePoints, api),
        reset: function (
          _matchInlineApi: Readonly<MatchInlinePhaseApi>,
          _nodePoints: ReadonlyArray<NodePoint>,
          startIndexOfBlock: number,
          _endIndexOfBlock: number,
        ) {
          api = _matchInlineApi
          nodePoints = _nodePoints
          endIndexOfBlock = _endIndexOfBlock
          delimiterIndexStack.length = 0

          const hg = hook.findDelimiter(
            startIndexOfBlock,
            endIndexOfBlock,
            nodePoints,
            api,
          ) as Iterator<YastTokenDelimiter, void, number>

          if (hg == null || typeof hg.next !== 'function') {
            _findDelimiter = (startIndex: number) => {
              return hook.findDelimiter(
                startIndex,
                endIndexOfBlock,
                nodePoints,
                api,
              ) as YastTokenDelimiter | null
            }
          } else {
            _findDelimiter = (startIndex: number) => {
              return hg.next(startIndex).value as YastTokenDelimiter | null
            }
          }

          lastDelimiter = null
          lastStartIndex = startIndexOfBlock - 1
        },
      }
    },
  )

  /**
   * Find nearest delimiters start from or after startIndex.
   */
  type NearestDelimiterItem = Pick<DelimiterItem, 'hook' | 'delimiter'>
  const findNearestDelimiters = (
    startIndex: number,
  ): { items: NearestDelimiterItem[]; nextIndex: number } => {
    let nearestDelimiters: NearestDelimiterItem[] = []
    let nearestDelimiterStartIndex: number | null = null

    for (let hIndex = 0; hIndex < hooks.length; ++hIndex) {
      const hook = hooks[hIndex]
      const delimiter = hook.findDelimiter(startIndex)
      if (delimiter == null) continue

      if (nearestDelimiterStartIndex != null) {
        if (delimiter.startIndex > nearestDelimiterStartIndex) continue
        if (delimiter.startIndex < nearestDelimiterStartIndex) {
          nearestDelimiters = []
        }
      }

      nearestDelimiterStartIndex = delimiter.startIndex
      nearestDelimiters.push({ hook, delimiter })
    }

    // No delimiters found
    if (nearestDelimiters.length <= 0) return { items: [], nextIndex: -1 }

    // Only one delimiter start from the nearest start index.
    const nextIndex: number = nearestDelimiterStartIndex! + 1

    /**
     * If there are multiple delimiters starting from the same index:
     *  - check whether there is a delimiter of type `full`, if so, return it.
     *
     *  - check whether there has multiple delimiters of type `both` or `closer`,
     *    if so, return the one with the maximum startIndex of a valid paired
     *    opener delimiter.
     */
    if (nearestDelimiters.length > 1) {
      let potentialCloserCount = 0
      for (const item of nearestDelimiters) {
        const dType = item.delimiter.type
        if (dType === 'full') return { items: [item], nextIndex }
        if (dType === 'both' || dType === 'closer') potentialCloserCount += 1
      }

      if (potentialCloserCount > 1) {
        let validCloserIndex = -1,
          validPairedOpenerStartIndex = -1
        for (let index = 0; index < nearestDelimiters.length; ++index) {
          const { hook, delimiter } = nearestDelimiters[index]
          if (delimiter.type === 'both' || delimiter.type === 'closer') {
            const openerDelimiter = processor.findNearestPairedDelimiter(
              hook,
              delimiter,
            )
            if (openerDelimiter != null) {
              if (validPairedOpenerStartIndex < openerDelimiter.startIndex) {
                validCloserIndex = index
                validPairedOpenerStartIndex = openerDelimiter.startIndex
              }
            }
          }
        }

        const items: NearestDelimiterItem[] =
          validCloserIndex >= 0
            ? nearestDelimiters.slice(validCloserIndex, validCloserIndex + 1)
            : nearestDelimiters.filter(item => item.delimiter.type !== 'closer')
        return { items, nextIndex }
      }
    }

    return { items: nearestDelimiters, nextIndex }
  }

  const processor = createMultiPriorityDelimiterProcessor([])

  const process = (
    startIndexOfBlock: number,
    endIndexOfBlock: number,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): void => {
    // Initialize.
    for (const hook of hooks) {
      hook.reset(api, nodePoints, startIndexOfBlock, endIndexOfBlock)
    }

    // Process block phrasing content.
    for (let i = startIndexOfBlock; i < endIndexOfBlock; ) {
      const { items: nearestDelimiters, nextIndex } = findNearestDelimiters(i)
      if (nextIndex < 0) break

      i = nextIndex
      if (nearestDelimiters.length <= 0) continue

      /**
       * There may be multiple delimiters with the same startIndex in all
       * delimiters returned by different hooks, and they can be processed
       * in sequence, because the relative order of their openers in the stack
       * is the same as the relative order of closers in the stack.
       */
      for (const { hook, delimiter } of nearestDelimiters) {
        // Move forward.
        i = Math.max(i, delimiter.endIndex)
        processor.process(hook, delimiter)
      }
    }
  }

  const done = (): YastInlineToken[] => {
    const tokens = processor.done()
    return tokens
  }
  return { process, done }
}
