import type { NodePoint } from '@yozora/character'
import type {
  MatchInlinePhaseApi,
  ResultOfFindDelimiters,
  Tokenizer,
  TokenizerMatchInlineHook,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import { createSinglePriorityDelimiterProcessor } from './single-priority'
import type {
  DelimiterItem,
  DelimiterProcessorHook,
  PhrasingContentProcessor,
} from './types'

/**
 * Factory function for creating PhrasingContentProcessor
 *
 * ## 算法描述
 *
 * 1. 将所有的 hook 根据优先级划分成 G 组
 * 2. 对于第 i 组 hook，将第 [i+1, G] 组 hook 创建成 phrasingContentProcessor，
 *    不妨记作 pcp_i，让第 i 组 hook 共享这个基于 pcp_i 创建的新的
 *    api.resolveInternalTokens
 * 3. 根据 hook 分成的组进行 DFS 处理，每一组对应一层，每次重置当前层的所有 hook
 *    的状态信息
 *
 * ## 算法正确性
 *
 * 1. 因为每一组 hook 对应 DFS 中的一层，根据 DFS 的特性，每一次都是只走一条完整
 *    链（从当前节点直达叶子节点），因此当处理到第 i 层时，第 [i+1,G] 层所有的
 *    hook 要么从未被执行，要么均已被执行完毕，即此时可以将 [i+1,G] 层的所有 hook
 *    的状态重置。更一般地，可以在每次进入新层时，将该层所有的 hook 状态重置
 */
export function createPhrasingContentProcessor(
  hookGroups: DelimiterProcessorHook[][],
  hookGroupIndex: number,
): PhrasingContentProcessor {
  /**
   * Find nearest delimiters start from or after startIndex.
   */
  type NearestDelimiterItem = Pick<DelimiterItem, 'hook' | 'delimiter'>
  const findNearestDelimiters = (
    startIndex: number,
    endIndex: number,
    hooks: DelimiterProcessorHook[],
  ): { items: NearestDelimiterItem[]; nextIndex: number } => {
    let nearestDelimiters: NearestDelimiterItem[] = []
    let nearestDelimiterStartIndex: number | null = null

    const rangeIndex: [number, number] = [startIndex, endIndex]
    for (const hook of hooks) {
      const delimiter = hook.findDelimiter(rangeIndex)
      if (delimiter == null) continue

      if (nearestDelimiterStartIndex != null) {
        if (delimiter.startIndex > nearestDelimiterStartIndex) continue
        if (delimiter.startIndex < nearestDelimiterStartIndex) {
          nearestDelimiters = []
        }
      }

      nearestDelimiterStartIndex = delimiter.startIndex
      nearestDelimiters.push({ hook, delimiter })
    }

    // No delimiters found
    if (nearestDelimiters.length <= 0) return { items: [], nextIndex: -1 }

    // Only one delimiter start from the nearest start index.
    const nextIndex: number = nearestDelimiterStartIndex! + 1

    /**
     * If there are multiple delimiters starting from the same index:
     *  - check whether there is a delimiter of type `full`, if so, return it.
     *
     *  - check whether there has multiple delimiters of type `both` or `closer`,
     *    if so, return the one with the maximum startIndex of a valid paired
     *    opener delimiter.
     */
    if (nearestDelimiters.length > 1) {
      let potentialCloserCount = 0
      for (const item of nearestDelimiters) {
        const dType = item.delimiter.type
        if (dType === 'full')
          return { items: [item], nextIndex: item.delimiter.endIndex }
        if (dType === 'both' || dType === 'closer') potentialCloserCount += 1
      }

      if (potentialCloserCount > 1) {
        let validCloserIndex = -1
        let validPairedOpenerStartIndex = -1
        for (let index = 0; index < nearestDelimiters.length; ++index) {
          const { hook, delimiter } = nearestDelimiters[index]
          if (delimiter.type === 'both' || delimiter.type === 'closer') {
            const openerDelimiter = processor.findNearestPairedDelimiter(
              hook,
              delimiter,
            )
            if (openerDelimiter != null) {
              if (validPairedOpenerStartIndex < openerDelimiter.startIndex) {
                validCloserIndex = index
                validPairedOpenerStartIndex = openerDelimiter.startIndex
              }
            }
          }
        }

        const items: NearestDelimiterItem[] =
          validCloserIndex > -1
            ? [nearestDelimiters[validCloserIndex]]
            : nearestDelimiters.filter(item => item.delimiter.type !== 'closer')
        return { items, nextIndex }
      }
    }

    return { items: nearestDelimiters, nextIndex }
  }

  const processor = createSinglePriorityDelimiterProcessor()
  const process = (
    higherPriorityTokens: ReadonlyArray<YastInlineToken>,
    _startIndex: number,
    _endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): ReadonlyArray<YastInlineToken> => {
    // Process block phrasing content.
    let tokens: ReadonlyArray<YastInlineToken> = higherPriorityTokens
    for (let hgIndex = hookGroupIndex; hgIndex < hookGroups.length; ++hgIndex) {
      const hooks = hookGroups[hgIndex]
      for (const hook of hooks) hook.reset(nodePoints)

      let tokenIndex = 0
      processor.reset(tokens)
      for (let i = _startIndex; i < _endIndex; ) {
        let endIndex = _endIndex
        for (; tokenIndex < tokens.length; ++tokenIndex) {
          const token = tokens[tokenIndex]
          if (i < token.startIndex) {
            endIndex = token.startIndex
            break
          }
          i = Math.max(i, token.endIndex)
        }

        const { items, nextIndex } = findNearestDelimiters(i, endIndex, hooks)
        if (nextIndex < 0 || items.length <= 0) {
          i = nextIndex < 0 ? endIndex : nextIndex
          continue
        }

        /**
         * There may be multiple delimiters with the same startIndex in all
         * delimiters returned by different hooks, and they can be processed
         * in sequence, because the relative order of their openers in the stack
         * is the same as the relative order of closers in the stack.
         */
        i += 1
        for (const { hook, delimiter } of items) {
          // Move forward.
          i = Math.max(i, delimiter.endIndex)
          processor.process(hook, delimiter)
        }
      }
      tokens = processor.done()
    }

    return tokens
  }

  return { process }
}

/**
 * @param matchPhaseHooks
 * @returns
 */
export function createProcessorHookGroups(
  matchPhaseHooks: ReadonlyArray<Tokenizer & TokenizerMatchInlineHook>,
  matchInlineApi: Readonly<Omit<MatchInlinePhaseApi, 'resolveInternalTokens'>>,
  resolveFallbackTokens: (
    tokens: ReadonlyArray<YastInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ) => ReadonlyArray<YastInlineToken>,
): DelimiterProcessorHook[][] {
  const hooks: Array<Tokenizer & TokenizerMatchInlineHook> = matchPhaseHooks
    .slice()
    .sort((h1, h2) => h2.priority - h1.priority)

  const hookGroups: DelimiterProcessorHook[][] = []
  for (let i = 0; i < hooks.length; ) {
    const hookGroup: DelimiterProcessorHook[] = []
    hookGroups.push(hookGroup)

    // Create a sub-DFS-layer processor.
    const processor = createPhrasingContentProcessor(
      hookGroups,
      hookGroups.length,
    )

    const api: Readonly<MatchInlinePhaseApi> = Object.freeze({
      ...matchInlineApi,
      resolveInternalTokens: (
        higherPriorityTokens: ReadonlyArray<YastInlineToken>,
        startIndex: number,
        endIndex: number,
        nodePoints: ReadonlyArray<NodePoint>,
      ): ReadonlyArray<YastInlineToken> => {
        let tokens = processor.process(
          higherPriorityTokens,
          startIndex,
          endIndex,
          nodePoints,
        )
        tokens = resolveFallbackTokens(tokens, startIndex, endIndex, nodePoints)
        return tokens
      },
    })

    const currentPriority = hooks[i].priority
    for (; i < hooks.length; ++i) {
      const hook = hooks[i]
      if (hook.priority !== currentPriority) break
      const processorHook = createProcessorHook(hook, api)
      hookGroup.push(processorHook)
    }
  }
  return hookGroups
}

/**
 * Create a processor-hook from tokenizer which implemented the match-inline
 * phase hook.
 *
 * @param hook
 * @param _matchInlineApi
 * @returns
 */
export function createProcessorHook(
  hook: Tokenizer & TokenizerMatchInlineHook,
  _matchInlineApi: Readonly<MatchInlinePhaseApi>,
): DelimiterProcessorHook {
  const api: Readonly<MatchInlinePhaseApi> = _matchInlineApi
  let nodePoints: ReadonlyArray<NodePoint>
  const delimiterIndexStack: number[] = []
  let _findDelimiter: ResultOfFindDelimiters<YastTokenDelimiter>

  const _isDelimiterPair: TokenizerMatchInlineHook['isDelimiterPair'] =
    hook.isDelimiterPair == null ? undefined : hook.isDelimiterPair.bind(hook)

  const _processDelimiterPair: TokenizerMatchInlineHook['processDelimiterPair'] =
    hook.processDelimiterPair == null
      ? undefined
      : hook.processDelimiterPair.bind(hook)

  const _processSingleDelimiter: TokenizerMatchInlineHook['processSingleDelimiter'] =
    hook.processSingleDelimiter == null
      ? undefined
      : hook.processSingleDelimiter.bind(hook)

  return {
    name: hook.name,
    priority: hook.priority,
    findDelimiter: rangeIndex => _findDelimiter.next(rangeIndex).value,
    isDelimiterPair:
      _isDelimiterPair == null
        ? () => ({ paired: true })
        : (openerDelimiter, closerDelimiter, higherPriorityTokens) =>
            _isDelimiterPair(
              openerDelimiter,
              closerDelimiter,
              higherPriorityTokens,
              nodePoints,
              api,
            ),
    processDelimiterPair:
      _processDelimiterPair == null
        ? (_1, _2, internalTokens) => ({ tokens: internalTokens })
        : (openerDelimiter, closerDelimiter, internalTokens) =>
            _processDelimiterPair(
              openerDelimiter,
              closerDelimiter,
              internalTokens,
              nodePoints,
              api,
            ),
    processSingleDelimiter:
      _processSingleDelimiter == null
        ? () => []
        : delimiter => _processSingleDelimiter(delimiter, nodePoints, api),
    reset: (_nodePoints: ReadonlyArray<NodePoint>) => {
      nodePoints = _nodePoints
      delimiterIndexStack.length = 0
      _findDelimiter = hook.findDelimiter(nodePoints, api)

      // start generator
      _findDelimiter.next()
    },
  }
}
