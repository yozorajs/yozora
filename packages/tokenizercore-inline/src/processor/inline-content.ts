import type { NodePoint } from '@yozora/character'
import type { YastMeta } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
} from '../types/tokenizer/lifecycle/match'
import type { DelimiterItem, DelimiterProcessorHook } from './types'
import { InlineTokenizer } from '../types/tokenizer/tokenizer'
import {
  createMultiPriorityDelimiterProcessor,
} from './delimiter-multipriority'


/**
 * block contents
 */
export type InlineContentProcessor = {
  /**
   *
   * @param nodePoints
   * @param startIndexOfBlock
   * @param endIndexOfBlock
   */
  process: (
    meta: YastMeta,
    nodePoints: ReadonlyArray<NodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ) => void

  done: () => InlineTokenizerMatchPhaseState[]
}


/**
 *
 */
export function createInlineContentProcessor(
  matchPhaseHooks: (InlineTokenizer & InlineTokenizerMatchPhaseHook)[],
): InlineContentProcessor {
  const hooks: DelimiterProcessorHook[] = matchPhaseHooks.map((hook): DelimiterProcessorHook => {
    let meta: Readonly<YastMeta>
    let nodePoints: ReadonlyArray<NodePoint>
    let endIndexOfBlock: number
    let lastDelimiter: InlineTokenDelimiter | null
    let lastStartIndex: number
    const delimiterIndexStack: number[] = []
    let _findDelimiter: (startIndex: number) => InlineTokenDelimiter | null

    return {
      name: hook.name,
      delimiterGroup: hook.delimiterGroup || hook.name,
      delimiterPriority: hook.delimiterPriority,
      findDelimiter: function (startIndex) {
        if (lastStartIndex >= startIndex) return lastDelimiter
        lastDelimiter = _findDelimiter(startIndex)
        lastStartIndex = lastDelimiter == null
          ? endIndexOfBlock
          : lastDelimiter.startIndex
        return lastDelimiter
      },
      isDelimiterPair: (openerDelimiter, closerDelimiter, higherPriorityInnerStates) =>
        hook.isDelimiterPair!(
          openerDelimiter,
          closerDelimiter,
          higherPriorityInnerStates,
          nodePoints,
          meta,
        ),
      processDelimiterPair: (openerDelimiter, closerDelimiter, innerStates) =>
        hook.processDelimiterPair!(
          openerDelimiter,
          closerDelimiter,
          innerStates,
          nodePoints,
          meta,
        ),
      processFullDelimiter: (fullDelimiter) =>
        hook.processFullDelimiter!(fullDelimiter, nodePoints, meta),
      reset: function (
        _meta: Readonly<YastMeta>,
        _nodePoints: ReadonlyArray<NodePoint>,
        startIndexOfBlock: number,
        _endIndexOfBlock: number,
      ) {
        meta = _meta
        nodePoints = _nodePoints
        endIndexOfBlock = _endIndexOfBlock
        delimiterIndexStack.length = 0

        const hg = hook.findDelimiter(
          startIndexOfBlock, endIndexOfBlock, nodePoints, meta
        ) as Iterator<InlineTokenDelimiter, void, number>

        if (hg == null || typeof hg.next !== 'function') {
          _findDelimiter = (startIndex: number) => {
            return hook.findDelimiter(
              startIndex, endIndexOfBlock, nodePoints, meta
            ) as InlineTokenDelimiter | null
          }
        } else {
          _findDelimiter = (startIndex: number) => {
            return hg.next(startIndex).value as InlineTokenDelimiter | null
          }
        }

        lastDelimiter = null
        lastStartIndex = startIndexOfBlock - 1
      }
    }
  })

  /**
   * Find nearest delimiters start from or after startIndex.
   */
  type NearestDelimiterItem = Pick<DelimiterItem, 'hook' | 'delimiter'>
  const findNearestDelimiters = (startIndex: number): NearestDelimiterItem[] => {
    let nearestDelimiters: NearestDelimiterItem[] = []
    let nearestDelimiterStartIndex: number | null = null

    for (let hIndex = 0; hIndex < hooks.length; ++hIndex) {
      const currentHook = hooks[hIndex]
      const currentDelimiter = currentHook.findDelimiter(startIndex)
      if (currentDelimiter == null) continue

      if (nearestDelimiterStartIndex != null) {
        if (currentDelimiter.startIndex < nearestDelimiterStartIndex) {
          nearestDelimiters = []
        } else if (currentDelimiter.startIndex > nearestDelimiterStartIndex) {
          continue
        }
      }

      nearestDelimiterStartIndex = currentDelimiter.startIndex
      nearestDelimiters.push({
        hook: currentHook,
        delimiter: currentDelimiter,
      })
    }
    return nearestDelimiters
  }

  const processor = createMultiPriorityDelimiterProcessor([])

  const process = (
    meta: YastMeta,
    nodePoints: ReadonlyArray<NodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ): void => {
    // Initialize.
    for (const hook of hooks) {
      hook.reset(meta, nodePoints, startIndexOfBlock, endIndexOfBlock)
    }

    // Process block phrasing content.
    for (let i = startIndexOfBlock; i < endIndexOfBlock;) {
      let nearestDelimiters: NearestDelimiterItem[] = findNearestDelimiters(i)
      if (nearestDelimiters.length <= 0) break

      i = nearestDelimiters[0].delimiter.startIndex + 1
      const potentialCloserCount = nearestDelimiters.length <= 1
        ? 1
        : nearestDelimiters.reduce((acc, item) => {
          if (
            item.delimiter.type === 'both' ||
            item.delimiter.type === 'closer'
          ) return acc + 1
          return acc
        }, 0)

      if (potentialCloserCount > 1) {
        let validCloserIndex = -1, validCloserStartIndex = startIndexOfBlock - 1
        for (let index = 0; index < nearestDelimiters.length; ++index) {
          const { hook, delimiter } = nearestDelimiters[index]
          if (delimiter.type === 'both' || delimiter.type === 'closer') {
            const openerDelimiter = processor.findLatestPairedDelimiter(hook, delimiter)
            if (openerDelimiter != null) {
              if (validCloserStartIndex < openerDelimiter.startIndex) {
                validCloserIndex = index
                validCloserStartIndex = openerDelimiter.startIndex
              }
            }
          }
        }

        if (validCloserIndex >= 0) {
          nearestDelimiters = [nearestDelimiters[validCloserIndex]]
        } else {
          nearestDelimiters = nearestDelimiters
            .filter(item => item.delimiter.type !== 'closer')
        }
      }

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

  const done = (): InlineTokenizerMatchPhaseState[] => {
    const states = processor.done()
    return states
  }
  return { process, done }
}
