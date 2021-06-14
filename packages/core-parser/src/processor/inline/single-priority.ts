import type {
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import type {
  DelimiterItem,
  DelimiterProcessor,
  DelimiterProcessorHook,
} from './types'

/**
 * Create a processor for processing delimiters with same priority.
 */
export function createSinglePriorityDelimiterProcessor(
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
   * Try to find an openerDelimiter paired with the closerDelimiter.
   * @param hook
   * @param closerDelimiter
   */
  const findNearestPairedDelimiter = (
    hook: DelimiterProcessorHook,
    closerDelimiter: YastTokenDelimiter,
  ): YastTokenDelimiter | null => {
    if (delimiterStack.length <= 0) return null

    let item: DelimiterItem | null = null
    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      item = delimiterStack[i]
      if (item.inactive || item.hook !== hook) continue
      const openerDelimiter = item.delimiter
      const result = hook.isDelimiterPair(openerDelimiter, closerDelimiter, [])
      return result.paired ? openerDelimiter : null
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

      const openerTokenStackIndex = item.tokenStackIndex
      innerTokens = tokenStack.splice(openerTokenStackIndex).concat(innerTokens)
      remainOpenerDelimiter = item.delimiter

      while (remainOpenerDelimiter != null && remainCloserDelimiter != null) {
        const preResult = hook.isDelimiterPair(
          remainOpenerDelimiter,
          remainCloserDelimiter,
          [],
        )

        // Unpaired, clear remaining contents of delimiters.
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
        const remainDelimiter = consume(hook, delimiter)
        if (remainDelimiter != null) push(hook, remainDelimiter)
        break
      }
      case 'closer': {
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
    // Concat the remaining of _tokens.
    const tokens = tokenStack.concat(initialTokens.slice(topOfConsumedTokens))
    return tokens
  }

  return {
    process,
    done,
    findNearestPairedDelimiter,
  }
}

/**
 * Mark all delimiters in the stack those are in the same group as the given
 * delimiterGroup as inactive (or invalid).
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
    if (item.hook.delimiterGroup === delimiterGroup) item.inactive = true
  }
}

/**
 * Clear the delimiter nodes those are no longer active (deactivated) at the top
 * of the delimiter stack.
 * @param delimiterStack
 * @param startStackIndex
 */
export function cutStaleBranch(
  delimiterStack: DelimiterItem[],
  startStackIndex: number,
): void {
  let top = startStackIndex - 1
  for (; top >= 0; --top) {
    const item = delimiterStack[top]
    if (!item.inactive) break
  }
  // eslint-disable-next-line no-param-reassign
  delimiterStack.length = top + 1
}
