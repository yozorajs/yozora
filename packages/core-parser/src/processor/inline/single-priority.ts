import type { IYastInlineToken, IYastTokenDelimiter } from '@yozora/core-tokenizer'
import type { IDelimiterItem, IDelimiterProcessor, IDelimiterProcessorHook } from './types'

/**
 * Create a processor for processing delimiters with same priority.
 */
export function createSinglePriorityDelimiterProcessor(): IDelimiterProcessor {
  let htIndex = 0
  const higherPriorityTokens: IYastInlineToken[] = []
  const delimiterStack: IDelimiterItem[] = []
  const tokenStack: IYastInlineToken[] = []

  /**
   * Push delimiter into delimiterStack.
   * @param hook
   * @param delimiter
   */
  const push = (hook: IDelimiterProcessorHook, delimiter: IYastTokenDelimiter): void => {
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
    hook: IDelimiterProcessorHook,
    closerDelimiter: IYastTokenDelimiter,
  ): IYastTokenDelimiter | null => {
    if (delimiterStack.length <= 0) return null

    let item: IDelimiterItem | null = null
    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      item = delimiterStack[i]
      if (item.inactive || item.hook !== hook) continue
      const openerDelimiter = item.delimiter
      const result = hook.isDelimiterPair(openerDelimiter, closerDelimiter, higherPriorityTokens)
      if (result.paired) return openerDelimiter
      if (!result.closer) return null
    }
    return null
  }

  /**
   * Try to find opener delimiter paired with the give closerDelimiter and
   * process them into IYastInlineToken.
   * @param hook
   * @param closerDelimiter
   */
  const consume = (
    hook: IDelimiterProcessorHook,
    closerDelimiter: IYastTokenDelimiter,
  ): IYastTokenDelimiter | null => {
    if (delimiterStack.length <= 0) return closerDelimiter

    let remainOpenerDelimiter: IYastTokenDelimiter | undefined
    let remainCloserDelimiter: IYastTokenDelimiter | undefined = closerDelimiter
    let internalTokens: IYastInlineToken[] = []

    // A closer delimiter may consume multiple opener / both delimiters in
    // the stack.
    for (let i = delimiterStack.length - 1; i >= 0; --i) {
      const item = delimiterStack[i]
      if (item.hook !== hook || item.inactive) continue

      const openerTokenStackIndex = item.tokenStackIndex
      if (openerTokenStackIndex < tokenStack.length) {
        internalTokens = tokenStack.splice(openerTokenStackIndex).concat(internalTokens)
      }

      remainOpenerDelimiter = item.delimiter
      while (remainOpenerDelimiter != null && remainCloserDelimiter != null) {
        if (remainCloserDelimiter.type === 'opener') {
          push(hook, remainCloserDelimiter)
          remainCloserDelimiter = undefined
          break
        }

        // Only 'both' or 'closer' type delimiter could be valid closer delimiter.
        if (remainCloserDelimiter.type === 'full') break

        const prePairResult = hook.isDelimiterPair(
          remainOpenerDelimiter,
          remainCloserDelimiter,
          internalTokens,
        )

        // Unpaired, clear remaining contents of delimiters.
        if (!prePairResult.paired) {
          /**
           * remainOpenerDelimiter is no longer a potential opener delimiter,
           * but it may still be processed as an independent delimiter.
           */
          if (!prePairResult.opener) {
            const tokens = hook.processSingleDelimiter(remainOpenerDelimiter)
            if (tokens.length > 0) {
              for (const token of tokens) token._tokenizer = hook.name
              internalTokens.unshift(...(tokens as IYastInlineToken[]))
            }

            remainOpenerDelimiter = undefined
            item.inactive = true
          }

          /**
           * remainCloserDelimiter is no longer a potential closer delimiter,
           * but it may still be processed as an independent delimiter.
           */
          if (!prePairResult.closer) {
            const tokens = hook.processSingleDelimiter(remainCloserDelimiter)
            if (tokens.length > 0) {
              for (const token of tokens) token._tokenizer = hook.name
              internalTokens.push(...(tokens as IYastInlineToken[]))
            }

            remainCloserDelimiter = undefined
          }
          break
        }

        const result = hook.processDelimiterPair(
          remainOpenerDelimiter,
          remainCloserDelimiter,
          internalTokens,
        )

        // Set internalTokens returned by processDelimiterPair.
        {
          for (const token of result.tokens) {
            if (token._tokenizer == null) token._tokenizer = hook.name
          }
          internalTokens = result.tokens as IYastInlineToken[]
        }

        remainOpenerDelimiter = result.remainOpenerDelimiter
        remainCloserDelimiter = result.remainCloserDelimiter

        cutStaleBranch(delimiterStack, i)
        i = Math.min(i, delimiterStack.length)
        if (remainOpenerDelimiter != null) push(hook, remainOpenerDelimiter)
      }

      if (remainCloserDelimiter == null || remainCloserDelimiter.type === 'full') {
        break
      }
    }

    tokenStack.push(...internalTokens)

    if (remainCloserDelimiter == null) return null

    // Resolve 'full' / 'closer' type delimiter.
    if (remainCloserDelimiter.type === 'full' || remainCloserDelimiter.type === 'closer') {
      const tokens = hook.processSingleDelimiter(remainCloserDelimiter)
      for (const token of tokens) {
        token._tokenizer = hook.name
        tokenStack.push(token as IYastInlineToken)
      }
      return null
    }
    return remainCloserDelimiter
  }

  const process = (hook: IDelimiterProcessorHook, delimiter: IYastTokenDelimiter): void => {
    for (; htIndex < higherPriorityTokens.length; ++htIndex) {
      const token = higherPriorityTokens[htIndex]
      if (token.startIndex >= delimiter.endIndex) break

      // The token may be inside the delimiter.
      if (token.startIndex >= delimiter.startIndex) continue
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
          token._tokenizer = hook.name
          tokenStack.push(token as IYastInlineToken)
        }
        break
      }
      default:
        throw new TypeError(`Unexpected delimiter type(${delimiter.type}) from ${hook.name}.`)
    }
  }

  const done = (): ReadonlyArray<IYastInlineToken> => {
    const tokens: IYastInlineToken[] = []
    for (const { delimiter, hook } of delimiterStack) {
      const result = hook.processSingleDelimiter(delimiter)
      for (const token of result) {
        token._tokenizer = hook.name
        tokens.push(token as IYastInlineToken)
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

  const reset = (_higherPriorityTokens: ReadonlyArray<IYastInlineToken>): void => {
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
export function cutStaleBranch(delimiterStack: IDelimiterItem[], startStackIndex: number): void {
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
  tokens1: ReadonlyArray<IYastInlineToken>,
  tokens2: ReadonlyArray<IYastInlineToken>,
): ReadonlyArray<IYastInlineToken> {
  if (tokens1.length <= 0) return tokens2
  if (tokens2.length <= 0) return tokens1

  const tokens: IYastInlineToken[] = []
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
