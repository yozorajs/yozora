import type { YastToken, YastTokenDelimiter } from '@yozora/tokenizercore'
import type {
  DelimiterItem,
  DelimiterProcessor,
  DelimiterProcessorHook,
} from './types'
import {
  createSinglePriorityDelimiterProcessor,
  cutStaleBranch,
  invalidateOldDelimiters,
} from './single-priority'


/**
 * Process delimiterItem list with inner tokens to an array of YastToken.
 * a array of YastToken.
 *
 * @param delimiterItems
 * @param tokens
 */
export function processDelimiters(
  delimiterItems: DelimiterItem[],
  tokens: YastToken[],
): YastToken[] {
  if (delimiterItems.length <= 0) return tokens

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
      const item = items[firstOpenerIndex]
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
  if (delimiterItems.length <= 0) return tokens

  const firstPriority = delimiterItems[0].hook.delimiterPriority
  const allInSamePriority = delimiterItems.every(
    x => x.hook.delimiterPriority === firstPriority)

  // const processor = createSinglePriorityDelimiterProcessor(tokens)
  const processor = allInSamePriority
    ? createSinglePriorityDelimiterProcessor(tokens)
    : createMultiPriorityDelimiterProcessor(tokens)

  // All hooks have same delimiterPriority.
  for (const { hook, delimiter } of delimiterItems) {
    processor.process(hook, delimiter)
  }
  return processor.done()
}


/**
 * Create a processor for processing delimiters with same priority.
 */
export function createMultiPriorityDelimiterProcessor(
  initialTokens: YastToken[],
): DelimiterProcessor {
  const delimiterStack: DelimiterItem[] = []
  const tokenStack: YastToken[] = []

  /**
   * Push delimiter into delimiterStack.
   * @param hook
   * @param delimiter
   */
  const push = (hook: DelimiterProcessorHook, delimiter: YastTokenDelimiter): void => {
    delimiterStack.push({
      hook,
      delimiter,
      inactive: false,
      tokenStackIndex: tokenStack.length,
    })
  }

  /**
   * Check if there is a higher priority delimiter in front.
   * @param hook
   */
  const hasHigherPriorityDelimiter = (hook: DelimiterProcessorHook): boolean => {
    const priority = hook.delimiterPriority
    for (const delimiterItem of delimiterStack) {
      if (delimiterItem.inactive) continue
      if (delimiterItem.hook.delimiterPriority > priority) return true
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
    closerDelimiter: YastTokenDelimiter
  ): YastTokenDelimiter | null => {
    if (delimiterStack.length <= 0) return null
    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      const currentDelimiterItem = delimiterStack[i]
      if (
        currentDelimiterItem.inactive ||
        currentDelimiterItem.hook !== hook
      ) continue

      // Calc higher priority innerTokens.
      const openerTokenStackIndex = currentDelimiterItem.tokenStackIndex
      const higherPriorityInnerTokens = tokenStack.slice(openerTokenStackIndex)

      const openerDelimiter = currentDelimiterItem.delimiter
      const result = hook.isDelimiterPair(
        openerDelimiter, closerDelimiter, higherPriorityInnerTokens)
      if (result.paired) return openerDelimiter
      if (!result.closer) return null
    }
    return null
  }

  /**
   * Try to find opener delimiter paired with the give closerDelimiter and
   * process them into YastToken.
   * @param hook
   * @param closerDelimiter
   */
  const consume = (
    hook: DelimiterProcessorHook,
    closerDelimiter: YastTokenDelimiter
  ): YastTokenDelimiter | undefined => {
    if (delimiterStack.length <= 0) return closerDelimiter

    let remainOpenerDelimiter: YastTokenDelimiter | undefined
    let remainCloserDelimiter: YastTokenDelimiter | undefined = closerDelimiter
    let innerTokens: YastToken[] = []
    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      const currentDelimiterItem = delimiterStack[i]
      if (
        currentDelimiterItem.inactive ||
        currentDelimiterItem.hook !== hook || (
          currentDelimiterItem.delimiter.type !== 'opener' &&
          currentDelimiterItem.delimiter.type !== 'both'
        )
      ) continue

      const openerTokenStackIndex = currentDelimiterItem.tokenStackIndex
      remainOpenerDelimiter = currentDelimiterItem.delimiter

      const higherPriorityInnerTokens = tokenStack.splice(openerTokenStackIndex)
      innerTokens = processDelimiters(
        delimiterStack.slice(i + 1),
        higherPriorityInnerTokens.concat(innerTokens)
      )
      while (remainOpenerDelimiter != null && remainCloserDelimiter != null) {
        const preResult = hook.isDelimiterPair(
          remainOpenerDelimiter, remainCloserDelimiter, higherPriorityInnerTokens)

        if (preResult.paired) {
          const result = hook.processDelimiterPair(
            remainOpenerDelimiter, remainCloserDelimiter, innerTokens.slice())
          innerTokens = Array.isArray(result.token) ? result.token : [result.token]
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

    tokenStack.push(...innerTokens)
    return remainCloserDelimiter
  }

  let initialTokenIndex = 0
  const process = (hook: DelimiterProcessorHook, delimiter: YastTokenDelimiter): void => {
    for (; initialTokenIndex < initialTokens.length; ++initialTokenIndex) {
      const token = initialTokens[initialTokenIndex]
      if (token.endIndex <= delimiter.startIndex) tokenStack.push(token)
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
        const token = hook.processFullDelimiter(delimiter)
        if (token != null) tokenStack.push(token)
        break
      }
      default:
        throw new TypeError(
          `Unexpected delimiter type(${ delimiter.type }) from ${ hook.name }.`)
    }
  }

  const done = (): YastToken[] => {
    // Process the remaining delimiters.
    const tokens = processDelimiters(delimiterStack, tokenStack)
    return tokens
  }

  return {
    process,
    done,
    findLatestPairedDelimiter,
  }
}
