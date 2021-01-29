import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  ResultOfProcessDelimiter,
} from './types/tokenizer/lifecycle/match'
import type { InlineTokenizer } from './types/tokenizer/tokenizer'


type Hook = {
  name: string

  delimiterIndexStack: number[]

  findDelimiter: (startIndex: number) => InlineTokenDelimiter | null

  processDelimiter: (
    openerDelimiter: InlineTokenDelimiter,
    closerDelimiter: InlineTokenDelimiter,
    innerStates: InlineTokenizerMatchPhaseState[]
  ) => ResultOfProcessDelimiter

  processFullDelimiter: (
    fullDelimiter: InlineTokenDelimiter,
  ) => InlineTokenizerMatchPhaseState | null

  reset: (
    meta: YastMeta,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ) => void
}


type DelimiterItem = {
  /**
   * Hook which produce this delimiter.
   */
  hook: Hook
  /**
   * Inline token delimiter.
   */
  delimiter: InlineTokenDelimiter
  /**
   * Current top index of stateStack.
   */
  stateStackIndex: number
}


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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ) => void

  done: () =>InlineTokenizerMatchPhaseState[]
}


export function createInlineContentProcessor(
  matchPhaseHooks: (InlineTokenizer & InlineTokenizerMatchPhaseHook)[],
): InlineContentProcessor {
  const hooks: Hook[] = matchPhaseHooks.map((hook): Hook => {
    let meta: Readonly<YastMeta>
    let nodePoints: ReadonlyArray<EnhancedYastNodePoint>
    let endIndexOfBlock: number
    let lastDelimiter: InlineTokenDelimiter | null
    let lastStartIndex: number
    let _findDelimiter: (startIndex: number) => InlineTokenDelimiter | null

    return {
      name: hook.name,
      delimiterIndexStack: [],
      findDelimiter: function (startIndex) {
        if (lastStartIndex >= startIndex) return lastDelimiter
        lastDelimiter = _findDelimiter(startIndex)
        lastStartIndex = lastDelimiter == null
          ? endIndexOfBlock
          : lastDelimiter.startIndex
        return lastDelimiter
      },
      processDelimiter: (openerDelimiter, closerDelimiter, innerStates) =>
        hook.processDelimiter!(
          openerDelimiter, closerDelimiter, innerStates, nodePoints, meta),
      processFullDelimiter: (fullDelimiter) =>
        hook.processFullDelimiter!(fullDelimiter, nodePoints, meta),
      reset: function (
        _meta: Readonly<YastMeta>,
        _nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
        startIndexOfBlock: number,
        _endIndexOfBlock: number,
      ) {
        meta = _meta
        nodePoints = _nodePoints
        endIndexOfBlock = _endIndexOfBlock

        this.delimiterIndexStack = []

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

  const statesStack: InlineTokenizerMatchPhaseState[] = []
  const delimiterStack: DelimiterItem[] = []

  /**
   * Remove stale nodes of delimiterStack start from startStackIndex.
   * @param startStackIndex
   */
  const cutStaleBranch = (startStackIndex: number): void => {
    while (delimiterStack.length > startStackIndex) {
      const { hook } = delimiterStack.pop()!
      while (hook.delimiterIndexStack.length > 0) {
        const topIndex = hook.delimiterIndexStack.pop()!
        if (topIndex < startStackIndex) {
          hook.delimiterIndexStack.push(topIndex)
          break
        }
      }
    }
  }

  /**
   * @param hook
   * @param delimiter
   */
  const push = (hook: Hook, delimiter: InlineTokenDelimiter): void => {
    hook.delimiterIndexStack.push(delimiterStack.length)
    delimiterStack.push({
      hook,
      delimiter,
      stateStackIndex: statesStack.length,
    })
  }

  /**
   *
   * @param hook
   * @param delimiter
   */
  const consume = (
    hook: Hook,
    delimiter: InlineTokenDelimiter
  ): InlineTokenDelimiter | null => {
    const { delimiterIndexStack} = hook
    if (delimiterIndexStack.length <= 0) return delimiter

    let remainOpenerDelimiter: InlineTokenDelimiter | undefined = delimiter
    let remainCloserDelimiter: InlineTokenDelimiter | undefined = delimiter
    let innerStates: InlineTokenizerMatchPhaseState[] = []

    // Push innerStates back into stateStack before return.
    const beforeReturn = () => {
      statesStack.push(...innerStates)
    }

    for (let i = delimiterIndexStack.length - 1; i >= 0; --i) {
      const openerDelimiterIndex = delimiterIndexStack[i]
      const openerDelimiterItem = delimiterStack[openerDelimiterIndex]
      const openerStateStackIndex = delimiterStack[openerDelimiterIndex].stateStackIndex

      remainOpenerDelimiter = openerDelimiterItem.delimiter
      innerStates = statesStack.splice(openerStateStackIndex).concat(innerStates)
      while (remainOpenerDelimiter != null) {
        const result = hook.processDelimiter(
          remainOpenerDelimiter, remainCloserDelimiter, innerStates.slice())
        if (result == null) break

        cutStaleBranch(openerDelimiterIndex)
        innerStates = [result.state]

        remainOpenerDelimiter = result.remainOpenerDelimiter
        remainCloserDelimiter = result.remainCloserDelimiter

        if (remainCloserDelimiter == null) {
          if (remainOpenerDelimiter != null) {
            push(hook, remainOpenerDelimiter)
          }
          beforeReturn()
          return null
        }
      }
    }

    beforeReturn()
    return remainCloserDelimiter
  }

  const process = (
    meta: YastMeta,
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ): void => {
    // Re initialize.
    statesStack.length = 0
    delimiterStack.length = 0
    for (const hook of hooks) {
      hook.reset(meta, nodePoints, startIndexOfBlock, endIndexOfBlock)
    }

    /**
     *
     */
    for (let i = startIndexOfBlock; i < endIndexOfBlock;) {
      let hook: Hook | null = null
      let delimiter: InlineTokenDelimiter | null = null

      for (let hIndex = 0; hIndex < hooks.length; ++hIndex) {
        const currentHook = hooks[hIndex]
        const currentDelimiter = currentHook.findDelimiter(i)
        if (currentDelimiter == null) continue

        if (
          delimiter == null ||
          currentDelimiter.startIndex < delimiter.startIndex
        ) {
          hook = currentHook
          delimiter = currentDelimiter
        }
      }

      if (delimiter == null || hook == null) break

      // Move forward.
      i = delimiter.endIndex

      switch (delimiter.type) {
        case 'full': {
          const state = hook.processFullDelimiter(delimiter)
          if (state != null) statesStack.push(state)
          break
        }
        case 'opener': {
          push(hook, delimiter)
          break
        }
        case 'both': {
          const remainDelimiter = consume(hook, delimiter)
          if (remainDelimiter != null) push(hook, delimiter)
          break
        }
        case 'closer': {
          consume(hook, delimiter)
          break
        }
        default:
          throw new TypeError(
            `Unexpected delimiter type(${ delimiter.type }) from ${ hook.name }.`)
      }
    }
  }

  return {
    process,
    done: () => statesStack
  }
}
