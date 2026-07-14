import type { Point } from '@yozora/ast'
import { isSpaceCharacter, isWhitespaceCharacter } from '@yozora/character'
import type {
  IBlockToken,
  IPartialBlockToken,
  IPhrasingContentLine,
  IResultOfEatContinuationText,
} from '@yozora/core-tokenizer'
import { calcEndPoint, calcIndentWidth } from '@yozora/core-tokenizer'
import invariant from '@yozora/invariant'
import type {
  IBlockContentProcessor,
  IBlockTokenTree,
  IMatchBlockPhaseHook,
  IMatchBlockState,
} from './types'

/**
 * Factory function for creating IBlockContentProcessor
 *
 * @param api
 * @param hooks
 * @param fallbackHook
 */
export const createBlockContentProcessor = (
  hooks: readonly IMatchBlockPhaseHook[],
  fallbackHook: IMatchBlockPhaseHook | null,
): IBlockContentProcessor => {
  const root: IBlockTokenTree = {
    _tokenizer: 'root',
    nodeType: 'root',
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    },
    children: [],
  }

  const stateStack: IMatchBlockState[] = []
  stateStack.push({
    hook: { isContainingBlock: true } as unknown as IMatchBlockPhaseHook,
    token: root,
  })

  let currentStackIndex = 0
  const positionUpdates: Array<{
    endPoint: Point
    stackIndex: number
  }> = []

  /**
   * Record a position update for the active stack prefix. Updates hidden by a
   * newer update at the same or a deeper stack index can never be observed, so
   * the retained stack indices stay strictly decreasing.
   * @param endPoint
   */
  const refreshPosition = (endPoint: Point): void => {
    while (
      positionUpdates.length > 0 &&
      positionUpdates[positionUpdates.length - 1].stackIndex <= currentStackIndex
    ) {
      positionUpdates.pop()
    }
    positionUpdates.push({
      endPoint: { ...endPoint },
      stackIndex: currentStackIndex,
    })
  }

  /**
   * Materialize the latest position update that includes the given state.
   * @param state
   * @param stackIndex
   */
  const syncPosition = (state: IMatchBlockState, stackIndex: number): void => {
    let low = 0
    let high = positionUpdates.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (positionUpdates[middle].stackIndex >= stackIndex) low = middle + 1
      else high = middle
    }

    const update = positionUpdates[low - 1]
    if (update == null) return

    const currentEnd = state.token.position.end
    const nextEnd = update.endPoint
    if (
      currentEnd.line === nextEnd.line &&
      currentEnd.column === nextEnd.column &&
      currentEnd.offset === nextEnd.offset
    ) {
      return
    }

    state.token.position.end = { ...nextEnd }
  }

  /**
   * Create a processor for processing failed lines.
   * @param lines
   */
  const createRollbackProcessor = (
    hook: IMatchBlockPhaseHook,
    lines: readonly IPhrasingContentLine[],
  ): IBlockContentProcessor | null => {
    if (lines.length <= 0) return null

    // Reprocess lines.
    const candidateHooks = hooks.filter(h => h !== hook)
    const processor = createBlockContentProcessor(candidateHooks, fallbackHook)

    for (const line of lines) {
      processor.consume(line)
    }

    // Return the processor
    return processor
  }

  /**
   * Pop the top element up from the IMatchBlockState stack.
   * @param item
   */
  const popup = (): IMatchBlockState | undefined => {
    const topState = stateStack.pop()
    if (topState == null) return undefined

    syncPosition(topState, stateStack.length)
    if (stateStack.length > 0) {
      const parent = stateStack[stateStack.length - 1]

      // Call the `onClose()` hook.
      if (topState.hook.onClose != null) {
        const result = topState.hook.onClose(topState.token)
        if (result != null) {
          switch (result.status) {
            case 'closingAndRollback': {
              const processor = createRollbackProcessor(topState.hook, result.lines)
              if (processor == null) break
              const internalRoot = processor.done()
              parent.token.children!.push(...internalRoot.children)
              break
            }
            case 'failedAndRollback': {
              parent.token.children!.pop()
              const processor = createRollbackProcessor(topState.hook, result.lines)
              if (processor == null) break
              const internalRoot = processor.done()
              parent.token.children!.push(...internalRoot.children)
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
  const cutStaleBranch = (nextTopIndex: number): void => {
    while (stateStack.length > nextTopIndex) popup()
  }

  /**
   * Push the given token into the stateStack, and update the ancients position.
   * @param hook
   * @param nextToken
   * @param saturated
   */
  const push = (hook: IMatchBlockPhaseHook, nextToken: IBlockToken, saturated: boolean): void => {
    cutStaleBranch(currentStackIndex + 1)

    const parent = stateStack[currentStackIndex]
    parent.token.children!.push(nextToken)
    // The new point supersedes every pending update after the stale branch is removed.
    positionUpdates.length = 0
    refreshPosition(nextToken.position.end)

    // Push into the IMatchBlockState stack.
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
    hook: IMatchBlockPhaseHook,
    lines: IPhrasingContentLine[],
    parent: IMatchBlockState,
  ): boolean => {
    const processor = createRollbackProcessor(hook, lines)
    if (processor == null) return false

    // Refresh the ancient nodes position.
    const internalStateStack = processor.shallowSnapshot()
    const internalStateRoot = internalStateStack[0]
    if (internalStateRoot.token.children != null) {
      parent.token.children!.push(...internalStateRoot.token.children)
    }
    // The rollback result supersedes every pending update before its states are adopted.
    positionUpdates.length = 0
    refreshPosition(internalStateRoot.token.position.end)

    // Refresh the stateStack and currentStackIndex
    for (let i = 1; i < internalStateStack.length; ++i) {
      const internalState = internalStateStack[i]
      stateStack.push(internalState)
    }
    currentStackIndex = stateStack.length - 1
    return true
  }

  /**
   * Consume simple line.
   */
  const consume = (line: Readonly<IPhrasingContentLine>): void => {
    const { nodePoints, startIndex: startIndexOfLine, endIndex: endIndexOfLine } = line
    let { firstNonWhitespaceIndex, indentWidth, countOfPrecedeSpaces, startIndex: i } = line

    /**
     * Generate eating line info from current start position.
     */
    const getEatingInfo = (): IPhrasingContentLine => ({
      nodePoints,
      startIndex: i,
      endIndex: endIndexOfLine,
      firstNonWhitespaceIndex,
      indentWidth,
      countOfPrecedeSpaces,
    })

    /**
     * Update the `i` to the next start index.
     * @param nextIndex   the next start index.
     * @param shouldRefreshPosition
     */
    const moveForward = (nextIndex: number, shouldRefreshPosition: boolean): void => {
      invariant(
        i <= nextIndex,
        `[DBTContext#moveForward] nextIndex(${nextIndex}) is behind i(${i}).`,
      )

      if (shouldRefreshPosition) {
        const endPoint = calcEndPoint(nodePoints, nextIndex - 1)
        refreshPosition(endPoint)
      }
      if (i === nextIndex) return

      i = nextIndex
      countOfPrecedeSpaces = 0
      firstNonWhitespaceIndex = nextIndex
      for (; firstNonWhitespaceIndex < endIndexOfLine; ++firstNonWhitespaceIndex) {
        const c = nodePoints[firstNonWhitespaceIndex].codePoint
        if (isSpaceCharacter(c)) {
          countOfPrecedeSpaces += 1
          continue
        }
        if (!isWhitespaceCharacter(c)) break
      }
      indentWidth = calcIndentWidth(nodePoints, nextIndex, firstNonWhitespaceIndex)
    }

    /**
     * Try to Consume nodePoints with a new opener.
     * @param hook
     * @param line
     */
    const consumeNewOpener = (hook: IMatchBlockPhaseHook, line: IPhrasingContentLine): boolean => {
      const parentState = stateStack[currentStackIndex]
      syncPosition(parentState, currentStackIndex)
      const { token: parentToken } = parentState
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

      const nextToken: IPartialBlockToken = result.token
      nextToken._tokenizer = hook.name
      push(hook, nextToken as IBlockToken, Boolean(result.saturated))
      return true
    }

    /**
     * Try to interrupt previous sibling token.
     * @param hook
     * @param line
     * @param stackIndex
     */
    const interruptSibling = (hook: IMatchBlockPhaseHook, line: IPhrasingContentLine): boolean => {
      if (hook.eatAndInterruptPreviousSibling == null) return false

      const { hook: siblingHook, token: siblingToken } = stateStack[currentStackIndex]
      const parentState = stateStack[currentStackIndex - 1]
      const { token: parentToken } = parentState
      if (hook.priority <= siblingHook.priority) return false

      // try `eatAndInterruptPreviousSibling` first
      const result = hook.eatAndInterruptPreviousSibling(line, siblingToken, parentToken)
      if (result == null) return false

      // Successfully interrupt the previous node.
      cutStaleBranch(currentStackIndex)

      // Remove previous sibling from its parent, then append the remaining
      // sibling token returned from the `hook.eatAndInterruptPreviousSibling()`
      parentToken.children!.pop()
      if (result.remainingSibling != null) {
        if (Array.isArray(result.remainingSibling)) {
          parentToken.children!.push(...result.remainingSibling)
        } else {
          parentToken.children!.push(result.remainingSibling)
        }
      }

      // Move forward
      moveForward(result.nextIndex, false)

      const nextToken: IPartialBlockToken = result.token
      nextToken._tokenizer = hook.name
      push(hook, nextToken as IBlockToken, Boolean(result.saturated))
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
        const eatingInfo = getEatingInfo()
        syncPosition(currentStateItem, currentStackIndex)
        syncPosition(stateStack[currentStackIndex - 1], currentStackIndex - 1)

        // Try to interrupt the current token.
        if (hooks.some(hook => hook !== currentHook && interruptSibling(hook, eatingInfo))) {
          break
        }

        const result: IResultOfEatContinuationText =
          currentHook.eatContinuationText == null
            ? { status: 'notMatched' }
            : currentHook.eatContinuationText(eatingInfo, currentStateItem.token, parentToken)

        let finished = false,
          rolledBack = false
        switch (result.status) {
          case 'failedAndRollback': {
            // Removed from parent token.
            parentToken.children!.pop()

            // Cut the stale branch from IMatchBlockState stack without call onClose.
            stateStack.length = currentStackIndex
            currentStackIndex -= 1

            if (result.lines.length > 0) {
              const parent = stateStack[currentStackIndex]
              if (rollback(currentHook, result.lines, parent)) {
                rolledBack = true
                break
              }
            }
            finished = true
            break
          }
          case 'closingAndRollback': {
            // Cut the stale branch before rollback.
            cutStaleBranch(currentStackIndex)

            if (result.lines.length > 0) {
              const parent = stateStack[currentStackIndex]
              if (rollback(currentHook, result.lines, parent)) {
                rolledBack = true
                break
              }
            }
            finished = true
            break
          }
          case 'notMatched': {
            currentStackIndex -= 1
            finished = true
            break
          }
          case 'closing': {
            moveForward(result.nextIndex, true)
            currentStackIndex -= 1
            finished = true
            break
          }
          case 'opening': {
            moveForward(result.nextIndex, true)
            break
          }
          default:
            throw new TypeError(
              `[eatContinuationText] unexpected status (${(result as any).status}).`,
            )
        }

        if (finished) break
        if (rolledBack) continue

        // Descend down the tree to the next unclosed node.
        currentStackIndex += 1
        parentToken = currentStateItem.token
      }
    }

    /**
     * Step 2: Next, after consuming the continuation markers for existing
     *         blocks, we look for new block starts (e.g. '>' for a blockquote)
     */
    const step2 = (): void => {
      if (i >= endIndexOfLine) return

      /**
       * If currentStackIndex less than stateStack.length, that means the step1
       * ended prematurely, so we should ensure the first newOpener could
       * interrupt the potential lazy continuation text (if it present).
       */
      if (currentStackIndex < stateStack.length) {
        const lastChild = stateStack[stateStack.length - 1]
        if (lastChild.hook.eatLazyContinuationText != null) {
          // Try to find a new internal block.
          const eatingInfo = getEatingInfo()

          /**
           * An indented code block cannot interrupt a paragraph.
           * @see https://github.github.com/gfm/#example-77
           * @see https://github.github.com/gfm/#example-216
           * @see https://github.github.com/gfm/#example-292
           * @see https://github.github.com/gfm/#example-269
           */
          if (eatingInfo.indentWidth >= 4) return
        }
      } else {
        // Otherwise, reset the currentStackIndex point to the top of the stack.
        currentStackIndex = stateStack.length - 1
      }

      while (i < endIndexOfLine && stateStack[currentStackIndex].hook.isContainingBlock) {
        // Try to eat a new internal block.
        let hasNewOpener = false
        const eatingInfo = getEatingInfo()
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
      if (i >= endIndexOfLine || currentStackIndex + 1 >= stateStack.length) return false

      const { hook, token } = stateStack[stateStack.length - 1]
      if (hook.eatLazyContinuationText == null) return false

      const tokenState = stateStack[stateStack.length - 1]
      const parentState = stateStack[stateStack.length - 2]
      syncPosition(tokenState, stateStack.length - 1)
      syncPosition(parentState, stateStack.length - 2)
      const { token: parentToken } = parentState
      const eatingInfo = getEatingInfo()
      const result = hook.eatLazyContinuationText(eatingInfo, token, parentToken)
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
            `[eatLazyContinuationText] unexpected status (${(result as any).status}).`,
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
      cutStaleBranch(currentStackIndex + 1)
    }

    // Try fallback tokenizer
    if (fallbackHook != null && i < endIndexOfLine) {
      const eatingInfo = getEatingInfo()
      consumeNewOpener(fallbackHook, eatingInfo)
    }

    invariant(
      firstNonWhitespaceIndex >= endIndexOfLine,
      '[IBlockContentProcessor] there is still unprocessed contents.' +
        ` startIndexOfLine(${startIndexOfLine}), endIndexOfLine(${endIndexOfLine})`,
    )
  }

  /**
   * All the content has been processed and perform the final collation actions.
   */
  const done = (): IBlockTokenTree => {
    while (stateStack.length > 1) popup()
    syncPosition(stateStack[0], 0)
    return root
  }

  return {
    consume,
    done,
    shallowSnapshot: () => {
      for (let i = 0; i < stateStack.length; ++i) syncPosition(stateStack[i], i)
      return [...stateStack]
    },
  }
}
