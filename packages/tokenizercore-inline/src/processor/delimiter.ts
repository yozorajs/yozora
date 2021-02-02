import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
} from '../types/tokenizer/lifecycle/match'
import type { DelimiterItem, DelimiterProcessorHook } from './types'


export type DelimiterProcessor = {
  process: (hook: DelimiterProcessorHook, delimiter: InlineTokenDelimiter) => void
  done: () => InlineTokenizerMatchPhaseState[]
  findLatestPairedDelimiter: (
    hook: DelimiterProcessorHook,
    closerDelimiter: InlineTokenDelimiter
  ) => InlineTokenDelimiter | null
}


/**
 * Process InlineTokenizerMatchPhaseState list and DelimiterItem list to
 * a array of InlineTokenizerMatchPhaseState.
 * @param states
 * @param delimiterItems
 */
export function processDelimiters(
  states: InlineTokenizerMatchPhaseState[],
  delimiterItems: DelimiterItem[],
): InlineTokenizerMatchPhaseState[] {
  if (delimiterItems.length <= 0) return states

  // Preprocess: remove bad delimiters.
  const hookDelimiterMap: Record<string, DelimiterItem[]> = {}
  for (const delimiterItem of delimiterItems) {
    if (delimiterItem.inactive) continue
    const items = hookDelimiterMap[delimiterItem.hook.name] || []
    items.push(delimiterItem)
    hookDelimiterMap[delimiterItem.hook.name] = items
  }
  for (const items of Object.values(hookDelimiterMap)) {
    let firstOpenerIndex = 0
    for (; firstOpenerIndex < items.length; ++firstOpenerIndex) {
      const item = items[firstOpenerIndex ]
      if (item.delimiter.type !== 'closer') break
      item.inactive = true
    }

    let lastCloserIndex = items.length - 1
    for (; lastCloserIndex > firstOpenerIndex; --lastCloserIndex) {
      const item = items[lastCloserIndex]
      if (item.delimiter.type !== 'opener') break
      item.inactive = true
    }

    if (
      firstOpenerIndex === lastCloserIndex &&
      items[firstOpenerIndex].delimiter.type !== 'full'
    ) {
      items[firstOpenerIndex].inactive = true
    }
  }

  // eslint-disable-next-line no-param-reassign
  delimiterItems = delimiterItems.filter(item => !item.inactive)
  if (delimiterItems.length <= 0) return states

  const firstPriority = delimiterItems[0].hook.delimiterPriority
  const allInSamePriority = delimiterItems.every(
    x => x.hook.delimiterPriority === firstPriority)

  // const processor = createSinglePriorityDelimiterProcessor(states)
  const processor = allInSamePriority
    ? createSinglePriorityDelimiterProcessor(states)
    : createMultiPriorityDelimiterProcessor(states)

  // All hooks have same delimiterPriority.
  for (const { hook, delimiter } of delimiterItems) {
    processor.process(hook, delimiter)
  }
  return processor.done()
}


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
      const result = hook.processDelimiter(openerDelimiter, closerDelimiter, [])
      switch (result.status) {
        case 'paired':
          return openerDelimiter
        case 'unpaired':
          if (result.remainOpenerDelimiter == null) return null
          break
      }
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
        const result = hook.processDelimiter(
          remainOpenerDelimiter, remainCloserDelimiter, innerStates.slice())

        if (result.status === 'paired') {
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
        }

        if (result.status === 'unpaired') {
          if (result.remainOpenerDelimiter == null) {
            remainOpenerDelimiter = undefined
            currentDelimiterItem.inactive = true
          }
          remainCloserDelimiter = result.remainCloserDelimiter
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
 * Create a processor for processing delimiters with same priority.
 */
export function createMultiPriorityDelimiterProcessor(
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

  const hasHigherPriorityDelimiter = (hook: DelimiterProcessorHook): boolean => {
    for (const delimiterItem of delimiterStack) {
      if (delimiterItem .inactive) continue
      if (delimiterItem.hook.delimiterPriority > hook.delimiterPriority) {
        return true
      }
    }
    return false
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
      const result = hook.processDelimiter(openerDelimiter, closerDelimiter, [])
      switch (result.status) {
        case 'paired':
          return openerDelimiter
        case 'unpaired':
          if (result.remainCloserDelimiter == null) return null
          break
      }
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
        currentDelimiterItem.hook !== hook || (
          currentDelimiterItem.delimiter.type !== 'opener' &&
          currentDelimiterItem.delimiter.type !== 'both'
        )
      ) continue

      const openerStateStackIndex = currentDelimiterItem.stateStackIndex
      remainOpenerDelimiter = currentDelimiterItem.delimiter
      innerStates = processDelimiters(
        stateStack.splice(openerStateStackIndex).concat(innerStates),
        delimiterStack.slice(i + 1)
      )

      while (remainOpenerDelimiter != null && remainCloserDelimiter != null) {
        const result = hook.processDelimiter(
          remainOpenerDelimiter, remainCloserDelimiter, innerStates.slice())

        if (result.status === 'paired') {
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
        }

        if (result.status === 'unpaired') {
          if (result.remainOpenerDelimiter == null) {
            remainOpenerDelimiter = undefined
            currentDelimiterItem.inactive = true
          }
          remainCloserDelimiter = result.remainCloserDelimiter
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
      if (state.endIndex <= delimiter.startIndex) stateStack.push(state)
    }

    switch (delimiter.type) {
      case 'opener': {
        push(hook, delimiter)
        break
      }
      case 'both': {
        if (hasHigherPriorityDelimiter(hook)) {
          push(hook, delimiter)
          break
        }
        const remainDelimiter = consume(hook, delimiter)
        if (remainDelimiter != null) push(hook, remainDelimiter)
        break
      }
      case 'closer': {
        if (hasHigherPriorityDelimiter(hook)) {
          push(hook, delimiter)
          break
        }
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
    // Process the remaining delimiters.
    const states = processDelimiters(stateStack, delimiterStack)
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
function invalidateOldDelimiters(
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
function cutStaleBranch(
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
