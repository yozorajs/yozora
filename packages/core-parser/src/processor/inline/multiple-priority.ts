import type {
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import {
  createSinglePriorityDelimiterProcessor,
  cutStaleBranch,
  invalidateOldDelimiters,
} from './single-priority'
import type {
  DelimiterItem,
  DelimiterProcessor,
  DelimiterProcessorHook,
} from './types'

/**
 * Process delimiterItem list with inner tokens to an array of YastInlineToken.
 * a array of YastInlineToken.
 *
 * @param delimiterItems
 * @param tokens
 */
export function processDelimiters(
  delimiterItems: DelimiterItem[],
  tokens: YastInlineToken[],
): YastInlineToken[] {
  if (delimiterItems.length <= 0) return tokens

  // Preprocess: invalidate bad delimiters.
  {
    const hookDelimiterMap: Record<string, DelimiterItem[]> = {}
    for (const item of delimiterItems) {
      if (item.inactive) continue
      const items = hookDelimiterMap[item.hook.name] ?? []
      items.push(item)
      hookDelimiterMap[item.hook.name] = items
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
  }

  // eslint-disable-next-line no-param-reassign
  delimiterItems = delimiterItems.filter(item => !item.inactive)
  if (delimiterItems.length <= 0) return tokens

  const firstPriority = delimiterItems[0].hook.priority
  const allInSamePriority = delimiterItems.every(
    x => x.hook.priority === firstPriority,
  )

  const processor = allInSamePriority
    ? createSinglePriorityDelimiterProcessor(tokens)
    : createMultiPriorityDelimiterProcessor(tokens)

  // All hooks have same priority.
  for (const { hook, delimiter } of delimiterItems) {
    processor.process(hook, delimiter)
  }
  return processor.done()
}

/**
 * Create a processor for processing delimiters with same priority.
 */
export function createMultiPriorityDelimiterProcessor(
  initialTokens: YastInlineToken[],
): DelimiterProcessor {
  const delimiterStack: DelimiterItem[] = []
  const tokenStack: YastInlineToken[] = []

  /**
   * Push delimiter into delimiterStack.
   * @param hook
   * @param delimiter
   */
  const push = (
    hook: DelimiterProcessorHook,
    delimiter: YastTokenDelimiter,
  ): void => {
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
  const hasHigherPriorityDelimiter = (
    hook: DelimiterProcessorHook,
  ): boolean => {
    const priority = hook.priority
    for (const item of delimiterStack) {
      if (item.inactive) continue
      if (item.hook.priority > priority) return true
    }
    return false
  }

  /**
   * Try to find an openerDelimiter paired with the closerDelimiter.
   * @param hook
   * @param closerDelimiter
   */
  const findNearestPairedDelimiter = (
    hook: DelimiterProcessorHook,
    closerDelimiter: YastTokenDelimiter,
  ): YastTokenDelimiter | null => {
    if (delimiterStack.length <= 0) return null

    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      const item = delimiterStack[i]
      if (item.inactive || item.hook !== hook) continue

      const higherPriorityInnerTokens = tokenStack.slice(item.tokenStackIndex)
      const openerDelimiter = item.delimiter
      const result = hook.isDelimiterPair(
        openerDelimiter,
        closerDelimiter,
        higherPriorityInnerTokens,
      )
      if (result.paired) return openerDelimiter
      if (!result.closer) return null
    }
    return null
  }

  /**
   * Try to find opener delimiter paired with the give closerDelimiter and
   * process them into YastInlineToken.
   * @param hook
   * @param closerDelimiter
   */
  const consume = (
    hook: DelimiterProcessorHook,
    closerDelimiter: YastTokenDelimiter,
  ): YastTokenDelimiter | undefined => {
    if (delimiterStack.length <= 0) return closerDelimiter

    let remainOpenerDelimiter: YastTokenDelimiter | undefined
    let remainCloserDelimiter: YastTokenDelimiter | undefined = closerDelimiter
    let innerTokens: YastInlineToken[] = []

    // A closer delimiter may consume multiple opener / both delimiters in
    // the stack.
    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      const item = delimiterStack[i]
      if (item.hook !== hook || item.inactive) continue

      if (item.delimiter.type !== 'opener' && item.delimiter.type !== 'both')
        continue

      const openerTokenStackIndex = item.tokenStackIndex
      const higherPriorityInnerTokens = tokenStack.splice(openerTokenStackIndex)
      innerTokens = processDelimiters(
        delimiterStack.slice(i + 1),
        higherPriorityInnerTokens.concat(innerTokens),
      )
      remainOpenerDelimiter = item.delimiter

      while (remainOpenerDelimiter != null && remainCloserDelimiter != null) {
        const preResult = hook.isDelimiterPair(
          remainOpenerDelimiter,
          remainCloserDelimiter,
          higherPriorityInnerTokens,
        )

        if (!preResult.paired) {
          if (!preResult.opener) {
            remainOpenerDelimiter = undefined
            item.inactive = true
          }
          if (!preResult.closer) {
            remainCloserDelimiter = undefined
          }
          break
        }

        const result = hook.processDelimiterPair(
          remainOpenerDelimiter,
          remainCloserDelimiter,
          innerTokens.slice(),
        )

        // Set innerTokens returned by processDelimiterPair.
        {
          const tokens = Array.isArray(result.token)
            ? result.token
            : [result.token]
          for (const token of tokens) {
            if (token._tokenizer == null) token._tokenizer = hook.name
          }
          innerTokens = tokens as YastInlineToken[]
        }

        remainOpenerDelimiter = result.remainOpenerDelimiter
        remainCloserDelimiter = result.remainCloserDelimiter

        cutStaleBranch(delimiterStack, i)
        i = Math.min(i, delimiterStack.length)

        // If the delimiters with the same delimiterGroup are marked as inactive,
        // then the current closer delimiter can no longer found a matched
        // delimiter (opener / both) from stack, so the loop can be ended early.
        if (result.shouldInactivateOlderDelimiters) {
          invalidateOldDelimiters(hook.delimiterGroup, delimiterStack, i)
          i = -1
          break
        }

        if (remainOpenerDelimiter == null) break
        push(hook, remainOpenerDelimiter)
      }
      if (remainCloserDelimiter == null) break
    }

    tokenStack.push(...innerTokens)
    return remainCloserDelimiter
  }

  let topOfConsumedTokens = 0
  const process = (
    hook: DelimiterProcessorHook,
    delimiter: YastTokenDelimiter,
  ): void => {
    for (; topOfConsumedTokens < initialTokens.length; ++topOfConsumedTokens) {
      const token = initialTokens[topOfConsumedTokens]
      if (token.startIndex >= delimiter.endIndex) break
      tokenStack.push(token)
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
        if (token != null) {
          token._tokenizer = hook.name
          tokenStack.push(token as YastInlineToken)
        }
        break
      }
      default:
        throw new TypeError(
          `Unexpected delimiter type(${delimiter.type}) from ${hook.name}.`,
        )
    }
  }

  const done = (): YastInlineToken[] => {
    // Process the remaining delimiters.
    const tokens = processDelimiters(delimiterStack, tokenStack)
    return tokens
  }

  return {
    process,
    done,
    findNearestPairedDelimiter,
  }
}
