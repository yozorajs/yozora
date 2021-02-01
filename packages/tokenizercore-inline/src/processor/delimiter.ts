import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
} from '../types/tokenizer/lifecycle/match'
import type { DelimiterItem, DelimiterProcessorHook } from './types'


export type DelimiterProcessor = {
  process: (hook: DelimiterProcessorHook, delimiter: InlineTokenDelimiter) => void
  done: () => InlineTokenizerMatchPhaseState[]
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
  // preprocess
  if (delimiterItems.length <= 1) return states

  const firstPriority = delimiterItems[0].hook.delimiterPriority
  const allInSamePriority = delimiterItems.every(
    x => x.hook.delimiterPriority === firstPriority)

  // const processor = createSinglePriorityDelimiterProcessor(states)
  const processor = allInSamePriority
    ? createSinglePriorityDelimiterProcessor(states)
    : createMultiPriorityDelimiterProcessor(states)

  // All hooks have same delimiterPriority.
  for (const { hook, delimiter, inactive } of delimiterItems) {
    if (inactive) continue
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
   * Remove stale nodes of delimiterStack start from startStackIndex.
   * @param startStackIndex
   */
  const cutStaleBranch = (startStackIndex: number): void => {
    let nextTopIndex = startStackIndex - 1
    for (; nextTopIndex >= 0; --nextTopIndex) {
      if (!delimiterStack[nextTopIndex].inactive) break
    }
    delimiterStack.length = nextTopIndex + 1
  }

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

      let paired = false
      while (remainOpenerDelimiter != null && remainCloserDelimiter != null) {
        const result = hook.processDelimiter(
          remainOpenerDelimiter, remainCloserDelimiter, innerStates.slice())

        if (result.status === 'paired') {
          if (!paired) {
            cutStaleBranch(i)
            i = Math.min(i, delimiterStack.length)

            // Inactivate all the older unprocessed delimiters produced by this hook.
            if (result.shouldInactivateOlderDelimiters) {
              for (i -= 1; i >= 0; --i) {
                const delimiter = delimiterStack[i]
                if (delimiter.hook === hook) delimiter.inactive = true
              }
            }
          }

          paired = true
          innerStates = Array.isArray(result.state) ? result.state : [result.state]
          remainOpenerDelimiter = result.remainOpenerDelimiter
          remainCloserDelimiter = result.remainCloserDelimiter
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

      if (remainOpenerDelimiter != null) {
        push(currentDelimiterItem.hook, remainOpenerDelimiter)
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

  return {
    process,
    done: () => [...stateStack]
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
   * Remove stale nodes of delimiterStack start from startStackIndex.
   * @param startStackIndex
   */
  const cutStaleBranch = (startStackIndex: number): void => {
    let nextTopIndex = startStackIndex - 1
    for (; nextTopIndex >= 0; --nextTopIndex) {
      if (!delimiterStack[nextTopIndex].inactive) break
    }
    delimiterStack.length = nextTopIndex + 1
  }

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

      let paired = false
      while (remainOpenerDelimiter != null && remainCloserDelimiter != null) {
        const result = hook.processDelimiter(
          remainOpenerDelimiter, remainCloserDelimiter, innerStates.slice())

        if (result.status === 'paired') {
          if (!paired) {
            cutStaleBranch(i)
            i = Math.min(i, delimiterStack.length)

            // Inactivate all the older unprocessed delimiters produced by this hook.
            if (result.shouldInactivateOlderDelimiters) {
              for (i -= 1; i >= 0; --i) {
                const delimiter = delimiterStack[i]
                if (delimiter.hook === hook) delimiter.inactive = true
              }
            }
          }

          paired = true
          innerStates = Array.isArray(result.state) ? result.state : [result.state]
          remainOpenerDelimiter = result.remainOpenerDelimiter
          remainCloserDelimiter = result.remainCloserDelimiter
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

      if (remainOpenerDelimiter != null) {
        push(currentDelimiterItem.hook, remainOpenerDelimiter)
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

    if (delimiter.type !== 'full' && hasHigherPriorityDelimiter(hook)) {
      push(hook, delimiter)
      return
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

  return {
    process,
    done: () => [...stateStack]
  }
}
