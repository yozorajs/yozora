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
export function createSinglePriorityDelimiterProcessor(): DelimiterProcessor {
  let htIndex = 0
  const higherPriorityTokens: YastInlineToken[] = []
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
  ): YastTokenDelimiter | null => {
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

        if (remainOpenerDelimiter != null) push(hook, remainOpenerDelimiter)
        if (
          remainCloserDelimiter != null &&
          remainCloserDelimiter.type === 'opener'
        ) {
          push(hook, remainCloserDelimiter)
          break
        }

        if (remainOpenerDelimiter == null) break
      }

      if (
        remainCloserDelimiter == null ||
        remainCloserDelimiter.type !== 'closer'
      ) {
        break
      }
    }

    tokenStack.push(...innerTokens)

    if (remainCloserDelimiter == null) return null

    // Resolve 'full' type delimiter.
    if (remainCloserDelimiter.type === 'full') {
      const tokens = hook.processSingleDelimiter(remainCloserDelimiter)
      for (const token of tokens) {
        if (token._tokenizer == null) token._tokenizer = hook.name
        tokenStack.push(token as YastInlineToken)
      }
      return null
    }

    return remainCloserDelimiter.type === 'both' ||
      remainCloserDelimiter.type === 'closer'
      ? remainCloserDelimiter
      : null
  }

  const process = (
    hook: DelimiterProcessorHook,
    delimiter: YastTokenDelimiter,
  ): void => {
    for (; htIndex < higherPriorityTokens.length; ++htIndex) {
      const token = higherPriorityTokens[htIndex]
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
        const tokens = hook.processSingleDelimiter(delimiter)
        for (const token of tokens) {
          if (token._tokenizer == null) token._tokenizer = hook.name
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
    const tokens: YastInlineToken[] = []
    for (const { delimiter, hook } of delimiterStack) {
      const result = hook.processSingleDelimiter(delimiter)
      for (const token of result) {
        if (token._tokenizer == null) token._tokenizer = hook.name
        tokens.push(token as YastInlineToken)
      }
    }

    delimiterStack.length = 0
    if (tokens.length > 0) {
      const nextTokenStack = mergeSortedTokens(tokenStack, tokens)
      tokenStack.length = 0
      tokenStack.push(...nextTokenStack)
    }

    // Concat the remaining of _tokens.
    const result = tokenStack.concat(higherPriorityTokens.slice(htIndex))
    return result
  }

  const reset = (_higherPriorityTokens: YastInlineToken[]): void => {
    higherPriorityTokens.length = _higherPriorityTokens.length
    for (let i = 0; i < _higherPriorityTokens.length; ++i) {
      higherPriorityTokens[i] = _higherPriorityTokens[i]
    }

    htIndex = 0
    delimiterStack.length = 0
    tokenStack.length = 0
  }

  return {
    process,
    done,
    reset,
    findNearestPairedDelimiter,
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

/**
 * Merge two sorted token stack.
 * @param tokens1
 * @param tokens2
 * @returns
 */
function mergeSortedTokens(
  tokens1: YastInlineToken[],
  tokens2: YastInlineToken[],
): YastInlineToken[] {
  const tokens: YastInlineToken[] = []
  let i = 0
  let j = 0
  for (; i < tokens1.length && j < tokens2.length; ) {
    if (tokens1[i].startIndex < tokens2[j].startIndex) {
      tokens.push(tokens1[i])
      i += 1
    } else {
      tokens.push(tokens2[j])
      j += 1
    }
  }

  for (; i < tokens1.length; ++i) tokens.push(tokens1[i])
  for (; j < tokens2.length; ++j) tokens.push(tokens2[j])
  return tokens
}
