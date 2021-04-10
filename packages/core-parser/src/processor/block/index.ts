import type { YastNodePoint } from '@yozora/ast'
import { isSpaceCharacter, isWhitespaceCharacter } from '@yozora/character'
import type {
  BlockFallbackTokenizer,
  PartialYastBlockToken,
  PhrasingContentLine,
  ResultOfEatContinuationText,
  TokenizerContext,
  YastBlockToken,
} from '@yozora/core-tokenizer'
import { calcEndYastNodePoint } from '@yozora/core-tokenizer'
import invariant from 'tiny-invariant'
import type {
  YastBlockTokenTree,
  YastMatchBlockState,
  YastMatchPhaseHook,
} from '../../types'

/**
 * Raw contents processor for generate YastBlockStateTree.
 */
export interface BlockContentProcessor {
  /**
   * Consume a phrasing content line.
   * @param line
   */
  consume(line: Readonly<PhrasingContentLine>): void

  /**
   * All the content has been processed and perform the final collation operation.
   */
  done(): YastBlockTokenTree

  /**
   * Get current YastMatchBlockState stack.
   */
  shallowSnapshot(): YastMatchBlockState[]
}

/**
 * Factory function for creating BlockContentProcessor
 *
 * @param context
 * @param hooks
 * @param fallbackHook
 */
export function createBlockContentProcessor(
  context: TokenizerContext,
  hooks: ReadonlyArray<YastMatchPhaseHook>,
  fallbackHook: (BlockFallbackTokenizer & YastMatchPhaseHook) | null,
): BlockContentProcessor {
  const root: YastBlockTokenTree = {
    _tokenizer: 'root',
    nodeType: 'root',
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    },
    children: [],
  }

  const stateStack: YastMatchBlockState[] = []
  stateStack.push({
    hook: ({ isContainerBlock: true } as unknown) as YastMatchPhaseHook,
    token: root,
  })

  /**
   * Update the ancients position.
   * @param endPoint
   */
  let currentStackIndex = 0
  const refreshPosition = (endPoint: YastNodePoint): void => {
    for (let sIndex = currentStackIndex; sIndex >= 0; --sIndex) {
      const o = stateStack[sIndex]
      o.token.position.end = { ...endPoint }
    }
  }

  /**
   * Create a processor for processing failed lines.
   * @param lines
   */
  const createRollbackProcessor = (
    hook: YastMatchPhaseHook,
    lines: ReadonlyArray<PhrasingContentLine>,
  ): BlockContentProcessor | null => {
    if (lines.length <= 0) return null

    // Reprocess lines.
    const candidateHooks = hooks.filter(h => h != hook)
    const processor = createBlockContentProcessor(
      context,
      candidateHooks,
      fallbackHook,
    )

    for (const line of lines) {
      processor.consume(line)
    }

    // Return the processor
    return processor
  }

  /**
   * Pop the top element up from the YastMatchBlockState stack.
   * @param item
   */
  const popup = (): YastMatchBlockState | undefined => {
    const topState = stateStack.pop()
    if (topState == null) return undefined

    if (stateStack.length > 0) {
      const parent = stateStack[stateStack.length - 1]

      // Call the `onClose()` hook.
      if (topState.hook.onClose != null) {
        const result = topState.hook.onClose(topState.token)
        if (result != null) {
          switch (result.status) {
            case 'closingAndRollback': {
              const processor = createRollbackProcessor(
                topState.hook,
                result.lines,
              )
              if (processor == null) break
              const innerRoot = processor.done()
              parent.token.children!.push(...innerRoot.children)
              break
            }
            case 'failedAndRollback': {
              parent.token.children!.pop()
              const processor = createRollbackProcessor(
                topState.hook,
                result.lines,
              )
              if (processor == null) break
              const innerRoot = processor.done()
              parent.token.children!.push(...innerRoot.children)
              break
            }
          }
        }
      }
    }

    if (currentStackIndex >= stateStack.length) {
      currentStackIndex = stateStack.length - 1
    }
    return topState
  }

  /**
   * Remove stale nodes.
   * @param includeCurrent  whether should also remove the stateStack[currentStackIndex]
   */
  const cutStaleBranch = (includeCurrent: boolean): void => {
    const endStackIndex = includeCurrent
      ? currentStackIndex
      : currentStackIndex + 1
    while (stateStack.length > endStackIndex) {
      popup()
    }
  }

  /**
   * Push the given token into the stateStack, and update the ancients position.
   * @param hook
   * @param nextToken
   * @param saturated
   */
  const push = (
    hook: YastMatchPhaseHook,
    nextToken: YastBlockToken,
    saturated: boolean,
  ): void => {
    cutStaleBranch(false)

    const parent = stateStack[currentStackIndex]
    parent.token.children!.push(nextToken)
    refreshPosition(nextToken.position.end)

    // Push into the YastMatchBlockState stack.
    currentStackIndex += 1
    stateStack.push({ hook, token: nextToken })

    // If the give token is saturated, then close it and pop it up.
    if (saturated) {
      popup()
    }
  }

  /**
   * Reprocess failed lines.
   * @param hook
   * @param lines
   * @param parent
   */
  const rollback = (
    hook: YastMatchPhaseHook,
    lines: PhrasingContentLine[],
    parent: YastMatchBlockState,
  ): boolean => {
    const processor = createRollbackProcessor(hook, lines)
    if (processor == null) return false

    // Refresh the ancient nodes position.
    const innerStateStack = processor.shallowSnapshot()
    const innerStateRoot = innerStateStack[0]
    if (innerStateRoot.token.children != null) {
      parent.token.children!.push(...innerStateRoot.token.children)
    }
    refreshPosition(innerStateRoot.token.position.end)

    // Refresh the stateStack and currentStackIndex
    for (let i = 1; i < innerStateStack.length; ++i) {
      const innerState = innerStateStack[i]
      stateStack.push(innerState)
    }
    currentStackIndex = stateStack.length - 1
    return true
  }

  /**
   * Consume simple line.
   */
  const consume = (line: Readonly<PhrasingContentLine>): void => {
    const {
      nodePoints,
      startIndex: startIndexOfLine,
      endIndex: endIndexOfLine,
    } = line
    let { firstNonWhitespaceIndex, countOfPrecedeSpaces, startIndex: i } = line

    /**
     * Generate eating line info from current start position.
     */
    const calcEatingInfo = (): PhrasingContentLine => {
      return {
        nodePoints,
        startIndex: i,
        endIndex: endIndexOfLine,
        firstNonWhitespaceIndex,
        countOfPrecedeSpaces,
      }
    }

    /**
     * Update the `i` to the next start index.
     * @param nextIndex   the next start index.
     * @param shouldRefreshPosition
     */
    const moveForward = (
      nextIndex: number,
      shouldRefreshPosition: boolean,
    ): void => {
      invariant(
        i <= nextIndex,
        `[DBTContext#moveForward] nextIndex(${nextIndex}) is behind i(${i}).`,
      )

      if (shouldRefreshPosition) {
        const endPoint = calcEndYastNodePoint(nodePoints, nextIndex - 1)
        refreshPosition(endPoint)
      }
      if (i === nextIndex) return

      i = nextIndex
      countOfPrecedeSpaces = 0
      firstNonWhitespaceIndex = nextIndex
      for (
        ;
        firstNonWhitespaceIndex < endIndexOfLine;
        ++firstNonWhitespaceIndex
      ) {
        const c = nodePoints[firstNonWhitespaceIndex].codePoint
        if (isSpaceCharacter(c)) {
          countOfPrecedeSpaces += 1
          continue
        }
        if (!isWhitespaceCharacter(c)) break
      }
    }

    /**
     * Try to Consume nodePoints with a new opener.
     * @param hook
     * @param line
     */
    const consumeNewOpener = (
      hook: YastMatchPhaseHook,
      line: PhrasingContentLine,
    ): boolean => {
      const { token: parentToken } = stateStack[currentStackIndex]
      const result = hook.eatOpener(line, parentToken)
      if (result == null) return false

      // The marker of the new data node cannot be empty.
      invariant(
        result.nextIndex > i,
        '[consumeNewOpener] The marker of the new data node cannot be empty.\n' +
          ` tokenizer(${result.token._tokenizer})`,
      )

      // Move forward
      moveForward(result.nextIndex, false)

      const nextToken: PartialYastBlockToken = result.token
      nextToken._tokenizer = hook.name
      push(hook, nextToken as YastBlockToken, Boolean(result.saturated))
      return true
    }

    /**
     * Try to interrupt previous sibling token.
     * @param hook
     * @param line
     * @param stackIndex
     */
    const interruptSibling = (
      hook: YastMatchPhaseHook,
      line: PhrasingContentLine,
      stackIndex: number,
    ): boolean => {
      if (stackIndex <= 0 || hook.eatAndInterruptPreviousSibling == null) {
        return false
      }

      const { hook: siblingHook, token: siblingToken } = stateStack[stackIndex]
      const { token: parentToken } = stateStack[stackIndex - 1]
      if (hook.priority <= siblingHook.priority) return false

      // try `eatAndInterruptPreviousSibling` first
      const result = hook.eatAndInterruptPreviousSibling(
        line,
        siblingToken,
        parentToken,
      )
      if (result == null) return false

      // Successfully interrupt the previous node.
      cutStaleBranch(currentStackIndex === stackIndex)

      // Remove previous sibling from its parent.
      if (result.remainingSibling == null) {
        parentToken.children!.pop()
        // TODO
        // parentToken.children!.push(result.remainingSibling!)
      }

      // Move forward
      moveForward(result.nextIndex, false)

      const nextToken: PartialYastBlockToken = result.token
      nextToken._tokenizer = hook.name
      push(hook, nextToken as YastBlockToken, Boolean(result.saturated))
      return true
    }

    /**
     * Step 1: First we iterate through the open blocks, starting with the
     *         root document, and descending through last children down to
     *         the last open block. Each block imposes a condition that the
     *         line must satisfy if the block is to remain open.
     * @see https://github.github.com/gfm/#phase-1-block-structure
     */
    const step1 = (): void => {
      // Reset current stack index to 1.
      currentStackIndex = 1

      // The root container block always successfully matches the continuation text.
      if (stateStack.length < 2) return

      let { token: parentToken } = stateStack[currentStackIndex - 1]
      while (i < endIndexOfLine && currentStackIndex < stateStack.length) {
        const currentStateItem = stateStack[currentStackIndex]
        const currentHook = currentStateItem.hook
        const eatingInfo = calcEatingInfo()

        // Try to interrupt the current token.
        let interrupted = false
        for (const hook of hooks) {
          if (hook === currentHook) continue
          if (interruptSibling(hook, eatingInfo, currentStackIndex)) {
            interrupted = true
            break
          }
        }
        if (interrupted) break

        const result: ResultOfEatContinuationText =
          currentHook.eatContinuationText == null
            ? { status: 'notMatched' }
            : currentHook.eatContinuationText(
                eatingInfo,
                currentStateItem.token,
                parentToken,
              )

        if (result.status === 'failedAndRollback') {
          // Removed from parent token.
          parentToken.children!.pop()

          // Cut the stale branch from YastMatchBlockState stack without call onClose.
          stateStack.length = currentStackIndex
          currentStackIndex -= 1

          if (result.lines.length > 0) {
            const parent = stateStack[currentStackIndex]
            if (rollback(currentHook, result.lines, parent)) continue
          }
          break
        } else if (result.status === 'closingAndRollback') {
          // Cut the stale branch before rollback.
          cutStaleBranch(true)
          if (result.lines.length > 0) {
            const parent = stateStack[currentStackIndex]
            if (rollback(currentHook, result.lines, parent)) continue
          }
          break
        } else if (result.status === 'notMatched') {
          currentStackIndex -= 1
          break
        } else if (result.status === 'closing') {
          moveForward(result.nextIndex, true)
          currentStackIndex -= 1
          break
        } else if (result.status === 'opening') {
          moveForward(result.nextIndex, true)
        } else {
          throw new TypeError(
            `[eatContinuationText] unexpected status (${
              (result as any).status
            }).`,
          )
        }

        // Descend down the tree to the next unclosed node.
        currentStackIndex += 1
        parentToken = currentStateItem.token
      }
    }

    /**
     * Step 2: Next, after consuming the continuation markers for existing
     *         blocks, we look for new block starts (e.g. > for a block quote)
     */
    const step2 = (): void => {
      if (i >= endIndexOfLine) return

      /**
       * If currentStackIndex less than stateStack.length, that means the step1
       * ended prematurely, so we should ensure the first newOpener could interrupt
       * the potential lazy continuation text (if it present).
       */
      if (currentStackIndex < stateStack.length) {
        const lastChild = stateStack[stateStack.length - 1]
        if (lastChild.hook.eatLazyContinuationText != null) {
          // Try to find a new inner block.
          const eatingInfo = calcEatingInfo()

          /**
           * An indented code block cannot interrupt a paragraph.
           * @see https://github.github.com/gfm/#example-77
           * @see https://github.github.com/gfm/#example-216
           * @see https://github.github.com/gfm/#example-292
           * @see https://github.github.com/gfm/#example-269
           */
          if (eatingInfo.countOfPrecedeSpaces >= 4) return

          // No new inner block found.
          if (
            hooks.every(
              hook =>
                hook.priority <= lastChild.hook.priority ||
                !consumeNewOpener(hook, eatingInfo),
            )
          ) {
            return
          }
        }
      } else {
        // Otherwise, reset the currentStackIndex point to the top of the stack.
        currentStackIndex = stateStack.length - 1
      }

      while (
        i < endIndexOfLine &&
        stateStack[currentStackIndex].hook.isContainerBlock
      ) {
        // Try to eat a new inner block.
        let hasNewOpener = false
        const eatingInfo = calcEatingInfo()
        for (const hook of hooks) {
          if (consumeNewOpener(hook, eatingInfo)) {
            hasNewOpener = true
            break
          }
        }
        if (!hasNewOpener) break
      }
    }

    /**
     * Step 3: Finally, we look at the remainder of the line (after block
     *         markers like >, list markers, and indentation have been consumed).
     *         This is text that can be incorporated into the last open block
     *         (a paragraph, code block, heading, or raw HTML).
     *
     *        If no lazy continuation text found, then close current opening
     *        token.
     */
    const step3 = (): boolean => {
      if (i >= endIndexOfLine || currentStackIndex + 1 >= stateStack.length)
        return false

      const { hook, token } = stateStack[stateStack.length - 1]
      if (hook.eatLazyContinuationText == null) return false

      const { token: parentToken } = stateStack[stateStack.length - 2]

      const eatingInfo = calcEatingInfo()
      const result = hook.eatLazyContinuationText(
        eatingInfo,
        token,
        parentToken,
      )
      switch (result.status) {
        case 'notMatched': {
          return false
        }
        case 'opening': {
          // Move forward and update position
          currentStackIndex = stateStack.length - 1
          moveForward(result.nextIndex, true)

          // Lazy continuation text found, so move forward the currentStackIndex
          // to the top of the stateStack.
          currentStackIndex = stateStack.length - 1
          return true
        }
        default:
          throw new TypeError(
            `[eatLazyContinuationText] unexpected status (${
              (result as any).status
            }).`,
          )
      }
    }

    /**
     * Initialize the first non-whitespace index.
     *
     * Not need, as the passed phrasing content line has already be initialized
     * the values.
     */
    // moveForward(startIndexOfLine, false)

    step1()
    step2()

    // No lazy continuation text found, so closed the stale branch.
    if (!step3()) {
      cutStaleBranch(false)
    }

    // Try fallback tokenizer
    if (fallbackHook != null && i < endIndexOfLine) {
      const eatingInfo = calcEatingInfo()
      consumeNewOpener(fallbackHook, eatingInfo)
    }

    invariant(
      firstNonWhitespaceIndex >= endIndexOfLine,
      '[BlockContentProcessor] there is still unprocessed contents.' +
        ` startIndexOfLine(${startIndexOfLine}), endIndexOfLine(${endIndexOfLine})`,
    )
  }

  /**
   * All the content has been processed and perform the final collation operation.
   */
  const done = (): YastBlockTokenTree => {
    while (stateStack.length > 1) popup()
    return root
  }

  return {
    consume,
    done,
    shallowSnapshot: () => [...stateStack],
  }
}
