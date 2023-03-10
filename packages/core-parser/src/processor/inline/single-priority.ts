import type { IInlineToken, ITokenDelimiter } from '@yozora/core-tokenizer'
import type { IDelimiterItem, IDelimiterProcessor, IDelimiterProcessorHook } from './types'

/**
 * Create a processor for processing delimiters with same priority.
 */
export const createSinglePriorityDelimiterProcessor = (): IDelimiterProcessor => {
  let htIndex = 0
  const higherPriorityTokens: IInlineToken[] = []
  const delimiterStack: IDelimiterItem[] = []
  const tokenStack: IInlineToken[] = []

  /**
   * Clear the delimiter nodes those are no longer active (deactivated) at the top
   * of the delimiter stack.
   * @param startStackIndex
   */
  const cutStaleBranch = (startStackIndex: number): void => {
    let top = startStackIndex - 1
    while (top >= 0 && delimiterStack[top].inactive) top -= 1
    delimiterStack.length = top + 1
  }

  /**
   * Push delimiter into delimiterStack.
   * @param hook
   * @param delimiter
   */
  const push = (hook: IDelimiterProcessorHook, delimiter: ITokenDelimiter): void => {
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
    closerDelimiter: ITokenDelimiter,
  ): ITokenDelimiter | null => {
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
   * process them into IInlineToken.
   * @param hook
   * @param closerDelimiter
   */
  const consume = (
    hook: IDelimiterProcessorHook,
    closerDelimiter: ITokenDelimiter,
  ): ITokenDelimiter | null => {
    if (delimiterStack.length <= 0) return closerDelimiter

    let remainOpenerDelimiter: ITokenDelimiter | undefined
    let remainCloserDelimiter: ITokenDelimiter | undefined = closerDelimiter
    let internalTokens: IInlineToken[] = []

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
              internalTokens.unshift(...(tokens as IInlineToken[]))
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
              internalTokens.push(...(tokens as IInlineToken[]))
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
          internalTokens = result.tokens as IInlineToken[]
        }

        remainOpenerDelimiter = result.remainOpenerDelimiter
        remainCloserDelimiter = result.remainCloserDelimiter

        cutStaleBranch(i)
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
        tokenStack.push(token as IInlineToken)
      }
      return null
    }
    return remainCloserDelimiter
  }

  const process = (hook: IDelimiterProcessorHook, delimiter: ITokenDelimiter): void => {
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
          tokenStack.push(token as IInlineToken)
        }
        break
      }
      default:
        throw new TypeError(`Unexpected delimiter type(${delimiter.type}) from ${hook.name}.`)
    }
  }

  const done = (): ReadonlyArray<IInlineToken> => {
    const tokens: IInlineToken[] = []
    for (const { delimiter, hook } of delimiterStack) {
      const result = hook.processSingleDelimiter(delimiter)
      for (const token of result) {
        token._tokenizer = hook.name
        tokens.push(token as IInlineToken)
      }
    }

    delimiterStack.length = 0
    if (tokens.length > 0) {
      const nextTokenStack = mergeSortedTokenStack(tokenStack, tokens)
      tokenStack.length = 0
      tokenStack.push(...nextTokenStack)
    }

    // Concat the remaining of _tokens.
    const result = tokenStack.concat(higherPriorityTokens.slice(htIndex))
    return result
  }

  const reset = (_higherPriorityTokens: ReadonlyArray<IInlineToken>): void => {
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
 * Merge two sorted token stack.
 * @param tokens1
 * @param tokens2
 * @returns
 */
const mergeSortedTokenStack = (
  tokens1: ReadonlyArray<IInlineToken>,
  tokens2: ReadonlyArray<IInlineToken>,
): ReadonlyArray<IInlineToken> => {
  if (tokens1.length <= 0) return tokens2
  if (tokens2.length <= 0) return tokens1

  const tokens: IInlineToken[] = []
  let i1 = 0
  let i2 = 0
  for (; i1 < tokens1.length && i2 < tokens2.length; ) {
    if (tokens1[i1].startIndex < tokens2[i2].startIndex) {
      tokens.push(tokens1[i1])
      i1 += 1
    } else {
      tokens.push(tokens2[i2])
      i2 += 1
    }
  }

  for (; i1 < tokens1.length; ++i1) tokens.push(tokens1[i1])
  for (; i2 < tokens2.length; ++i2) tokens.push(tokens2[i2])
  return tokens
}
