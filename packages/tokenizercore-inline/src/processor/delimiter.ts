import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
} from '../types/lifecycle/match'
import type {
  DelimiterItem,
  DelimiterProcessor,
  DelimiterProcessorHook,
} from '../types/processor'


/**
 * Create a processor for processing delimiters with same priority.
 */
export function createSinglePriorityDelimiterProcessor(
  initialStates: InlineTokenizerMatchPhaseState[],
): DelimiterProcessor {
  const delimiterStack: DelimiterItem[] = []
  const stateStack: InlineTokenizerMatchPhaseState[] = []

  /**
   * Push delimiter into delimiterStack.
   * @param hook
   * @param delimiter
   */
  const push = (hook: DelimiterProcessorHook, delimiter: InlineTokenDelimiter): void => {
    delimiterStack.push({
      hook,
      delimiter,
      inactive: false,
      stateStackIndex: stateStack.length,
    })
  }

  /**
   * Try to find an openerDelimiter paired with the closerDelimiter.
   * @param hook
   * @param closerDelimiter
   */
  const findLatestPairedDelimiter = (
    hook: DelimiterProcessorHook,
    closerDelimiter: InlineTokenDelimiter
  ): InlineTokenDelimiter | null => {
    if (delimiterStack.length <= 0) return null
    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      const currentDelimiterItem = delimiterStack[i]
      if (
        currentDelimiterItem.inactive ||
        currentDelimiterItem.hook !== hook
      ) continue

      const openerDelimiter = currentDelimiterItem.delimiter
      const result = hook.isDelimiterPair(openerDelimiter, closerDelimiter, [])
      if (result.paired) return openerDelimiter
      if (!result.closer) return null
    }
    return null
  }

  /**
   * Try to find opener delimiter paired with the give closerDelimiter and
   * process them into InlineTokenizerMatchPhaseState.
   * @param hook
   * @param closerDelimiter
   */
  const consume = (
    hook: DelimiterProcessorHook,
    closerDelimiter: InlineTokenDelimiter
  ): InlineTokenDelimiter | undefined => {
    if (delimiterStack.length <= 0) return closerDelimiter

    let remainOpenerDelimiter: InlineTokenDelimiter | undefined
    let remainCloserDelimiter: InlineTokenDelimiter | undefined = closerDelimiter
    let innerStates: InlineTokenizerMatchPhaseState[] = []
    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      const currentDelimiterItem = delimiterStack[i]
      if (
        currentDelimiterItem.inactive ||
        currentDelimiterItem.hook !== hook
      ) continue

      const openerStateStackIndex = delimiterStack[i].stateStackIndex
      remainOpenerDelimiter = currentDelimiterItem.delimiter
      innerStates = stateStack.splice(openerStateStackIndex).concat(innerStates)

      while (remainOpenerDelimiter != null && remainCloserDelimiter != null) {
        const preResult = hook.isDelimiterPair(
          remainOpenerDelimiter, remainCloserDelimiter, [])

        if (preResult.paired) {
          const result = hook.processDelimiterPair(
            remainOpenerDelimiter, remainCloserDelimiter, innerStates.slice())
          innerStates = Array.isArray(result.state) ? result.state : [result.state]
          remainOpenerDelimiter = result.remainOpenerDelimiter
          remainCloserDelimiter = result.remainCloserDelimiter

          cutStaleBranch(delimiterStack, i)
          i = Math.min(i, delimiterStack.length)

          if (result.shouldInactivateOlderDelimiters) {
            invalidateOldDelimiters(hook.delimiterGroup, delimiterStack, i)
            i = -1
            break
          }

          if (remainOpenerDelimiter == null) break
          push(hook, remainOpenerDelimiter)
          continue
        } else {
          if (!preResult.opener) {
            remainOpenerDelimiter = undefined
            currentDelimiterItem.inactive = true
          }
          if (!preResult.closer) {
            remainCloserDelimiter = undefined
          }
          break
        }
      }
      if (remainCloserDelimiter == null) break
    }

    stateStack.push(...innerStates)
    return remainCloserDelimiter
  }

  let initialStateIndex = 0
  const process = (hook: DelimiterProcessorHook, delimiter: InlineTokenDelimiter): void => {
    for (; initialStateIndex < initialStates.length; ++initialStateIndex) {
      const state = initialStates[initialStateIndex]
      if (state.startIndex >= delimiter.endIndex) break
      stateStack.push(state)
    }

    switch (delimiter.type) {
      case 'opener': {
        push(hook, delimiter)
        break
      }
      case 'both': {
        const remainDelimiter = consume(hook, delimiter)
        if (remainDelimiter != null) push(hook, remainDelimiter)
        break
      }
      case 'closer': {
        consume(hook, delimiter)
        break
      }
      case 'full': {
        const state = hook.processFullDelimiter(delimiter)
        if (state != null) stateStack.push(state)
        break
      }
      default:
        throw new TypeError(
          `Unexpected delimiter type(${ delimiter.type }) from ${ hook.name }.`)
    }
  }

  const done = (): InlineTokenizerMatchPhaseState[] => {
    // Concat the remaining of initialStates.
    const states = stateStack.concat(initialStates.slice(initialStateIndex))
    return states
  }

  return {
    process,
    done,
    findLatestPairedDelimiter,
  }
}


/**
 * Inactivate all the older unprocessed delimiters produced by hook which has
 * a same delimiterGroup.
 * @param delimiterGroup
 * @param delimiterItems
 * @param currentDelimiterIndex
 */
export function invalidateOldDelimiters(
  delimiterGroup: string,
  delimiterItems: ReadonlyArray<DelimiterItem>,
  currentDelimiterIndex: number,
): void {
  for (let i = currentDelimiterIndex - 1; i >= 0; --i) {
    const item = delimiterItems[i]
    if (item.hook.delimiterGroup === delimiterGroup) {
      item.inactive = true
    }
  }
}


/**
 * Remove stale nodes of delimiterStack start from startStackIndex.
 * @param delimiterStack
 * @param startStackIndex
 */
export function cutStaleBranch(
  delimiterStack: DelimiterItem[],
  startStackIndex: number,
): void {
  let nextTopIndex = startStackIndex - 1
  const { startIndex } = delimiterStack[startStackIndex].delimiter
  for (; nextTopIndex >= 0; --nextTopIndex) {
    const item = delimiterStack[nextTopIndex]
    if (startIndex <= item.delimiter.startIndex) continue
    if (!item.inactive) break
  }
  // eslint-disable-next-line no-param-reassign
  delimiterStack.length = nextTopIndex + 1
}
