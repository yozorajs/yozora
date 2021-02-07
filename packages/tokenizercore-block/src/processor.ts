import type { NodePoint } from '@yozora/character'
import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerContextMatchPhaseState,
  BlockTokenizerContextMatchPhaseStateTree,
} from './types/context'
import type {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  EatingLineInfo,
  FallbackBlockTokenizer,
  PhrasingContentLine,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatContinuationText,
} from './types/tokenizer'
import invariant from 'tiny-invariant'
import { isSpaceCharacter, isWhitespaceCharacter } from '@yozora/character'
import {
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'


type Hook = BlockTokenizer & BlockTokenizerMatchPhaseHook


type StateItem = {
  state: BlockTokenizerContextMatchPhaseState
  hook: Hook
}


/**
 * Raw contents processor for generate BlockTokenizerContextMatchPhaseStateTree.
 */
export type BlockContentProcessor = {
  /**
   * Consume simple line.
   *
   * @param nodePoints
   * @param startIndexOfLine
   * @param endIndexOfLine
   * @param _firstNonWhitespaceIndex
   */
  consume: (
    nodePoints: ReadonlyArray<NodePoint>,
    startIndexOfLine: number,
    endIndexOfLine: number,
    _firstNonWhitespaceIndex?: number,
  ) => void

  /**
   * All the content has been processed and perform the final collation operation.
   */
  done: () => BlockTokenizerContextMatchPhaseStateTree

  /**
   * Get current StateItem stack.
   */
  shallowSnapshot: () => StateItem[]
}


/**
 * Factory function for creating BlockContentProcessor
 *
 * @param hooks
 * @param fallbackHook
 */
export function createBlockContentProcessor(
  hooks: Hook[],
  fallbackHook: (FallbackBlockTokenizer & Hook) | null,
): BlockContentProcessor {
  const root: BlockTokenizerContextMatchPhaseStateTree = {
    data: { type: 'root' },
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    },
    children: [],
  }

  const stateStack: StateItem[] = []
  let currentStackIndex = 0

  stateStack.push({
    hook: { isContainerBlock: true } as unknown as Hook,
    state: root as BlockTokenizerContextMatchPhaseState,
  })

  /**
   * Update the ancients position.
   * @param endPoint
   */
  const refreshPosition = (endPoint: YastNodePoint): void => {
    for (let sIndex = currentStackIndex; sIndex >= 0; --sIndex) {
      const o = stateStack[sIndex]
      o.state.position.end = { ...endPoint }
    }
  }

  /**
   * Create a processor for processing failed lines.
   * @param lines
   */
  const createRollbackProcessor = (
    hook: Hook,
    lines: PhrasingContentLine[],
  ): BlockContentProcessor | null => {
    if (lines.length <= 0) return null

    // Reprocess lines.
    const candidateHooks = hooks.filter(h => h != hook)
    const processor = createBlockContentProcessor(candidateHooks, fallbackHook)
    for (const line of lines) {
      processor.consume(
        line.nodePoints,
        line.startIndex,
        line.endIndex,
        line.firstNonWhitespaceIndex
      )
    }

    // Return the processor
    return processor
  }

  /**
   * Pop the top element up from the StateItem stack.
   * @param item
   */
  const popup = (): StateItem | undefined => {
    const topState = stateStack.pop()
    if (topState == null) return undefined

    if (stateStack.length > 0) {
      const parent = stateStack[stateStack.length - 1]

      // Call the `onClose()` hook.
      if (topState.hook.onClose != null) {
        const result = topState.hook.onClose(topState.state.data)
        if (result != null) {
          switch (result.status) {
            case 'closingAndRollback': {
              const processor = createRollbackProcessor(topState.hook, result.lines)
              if (processor == null) break
              const innerRoot = processor.done()
              parent.state.children.push(...innerRoot.children)
              break
            }
            case 'failedAndRollback':
              const processor = createRollbackProcessor(topState.hook, result.lines)
              if (processor == null) break
              const innerRoot = processor.done()
              parent.state.children.pop()
              parent.state.children.push(...innerRoot.children)
              break
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
   * Push the given state into the stateStack, and update the ancients position.
   * @param hook
   * @param nextState
   * @param saturated
   */
  const push = (
    hook: Hook,
    nextState: BlockTokenizerContextMatchPhaseState,
    saturated: boolean,
  ): void => {
    cutStaleBranch(false)

    const parent = stateStack[currentStackIndex]
    parent.state.children.push(nextState)
    refreshPosition(nextState.position.end)

    // Push into the StateItem stack.
    currentStackIndex += 1
    stateStack.push({ hook, state: nextState })

    // If the give state is saturated, then close it and pop it up.
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
    hook: Hook,
    lines: PhrasingContentLine[],
    parent: StateItem,
  ): boolean => {
    const processor = createRollbackProcessor(hook, lines)
    if (processor == null) return false

    // Refresh the ancient nodes position.
    const innerStateStack = processor.shallowSnapshot()
    const innerStateRoot = innerStateStack[0]
    parent.state.children.push(...innerStateRoot.state.children)
    refreshPosition(innerStateRoot.state.position.end)

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
   *
   * @param nodePoints
   * @param startIndexOfLine
   * @param endIndexOfLine
   * @param _firstNonWhitespaceIndex
   */
  const consume = (
    nodePoints: ReadonlyArray<NodePoint>,
    startIndexOfLine: number,
    endIndexOfLine: number,
  ): void => {
    let i = -1, firstNonWhitespaceIndex = -1, countOfPrecedeSpaces = 0

    /**
     * Generate eating line info from current start position.
     */
    const calcEatingInfo = (): EatingLineInfo => {
      return {
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
    const moveForward = (nextIndex: number, shouldRefreshPosition: boolean): void => {
      invariant(
        i <= nextIndex,
        `[DBTContext#moveForward] nextIndex(${ nextIndex }) is behind i(${ i }).`
      )

      if (shouldRefreshPosition) {
        const endPoint = calcEndYastNodePoint(nodePoints, nextIndex - 1)
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
    }

    /**
     * Try to Consume nodePoints with a new opener.
     * @param hook
     * @param eatingInfo
     */
    const consumeNewOpener = (
      hook: Hook,
      eatingInfo: EatingLineInfo,
    ): boolean => {
      const { state: parentState } = stateStack[currentStackIndex]
      const result = hook.eatOpener(nodePoints, eatingInfo, parentState.data)
      if (result == null) return false

      // The marker of the new data node cannot be empty.
      invariant(
        result.nextIndex > i,
        '[BlockContentProcessor#consumeNewOpener] The marker of the new data node cannot be empty.\n' +
        ` type(${ result.state.type })`
      )

      // Move forward
      moveForward(result.nextIndex, false)

      const nextState: BlockTokenizerContextMatchPhaseState = {
        data: result.state,
        position: {
          start: calcStartYastNodePoint(nodePoints, eatingInfo.startIndex),
          end: calcEndYastNodePoint(nodePoints, result.nextIndex - 1),
        },
        children: [],
      }
      push(hook, nextState, Boolean(result.saturated))
      return true
    }

    /**
     * Try to interrupt previous sibling state.
     * @param hook
     * @param eatingInfo
     * @param stackIndex
     */
    const interruptSibling = (
      hook: Hook,
      eatingInfo: EatingLineInfo,
      stackIndex: number,
    ): boolean => {
      if (stackIndex <= 0) return false

      const { state: siblingState } = stateStack[stackIndex]
      const { state: parentState } = stateStack[stackIndex - 1]
      if (!hook.interruptableTypes.includes(siblingState.data.type)) return false

      let result: ResultOfEatAndInterruptPreviousSibling = null
      if (hook.eatAndInterruptPreviousSibling != null) {
        // try `eatAndInterruptPreviousSibling` first
        result = hook.eatAndInterruptPreviousSibling(
          nodePoints, eatingInfo, siblingState.data, parentState.data)
        if (result == null) return false
      } else {
        // Then try `eatOpener`
        result = hook.eatOpener(nodePoints, eatingInfo, parentState.data)
      }
      if (result == null) return false


      // Successfully interrupt the previous node.
      cutStaleBranch(currentStackIndex === stackIndex)

      // Remove previous sibling from its parent.
      if (result.shouldRemovePreviousSibling) {
        parentState.children.pop()
      }

      // Move forward
      moveForward(result.nextIndex, false)

      const nextState: BlockTokenizerContextMatchPhaseState = {
        data: result.state,
        position: {
          start: calcStartYastNodePoint(nodePoints, eatingInfo.startIndex),
          end: calcEndYastNodePoint(nodePoints, result.nextIndex - 1),
        },
        children: [],
      }
      push(hook, nextState, Boolean(result.saturated))
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

      let { state: parentState } = stateStack[currentStackIndex - 1]
      while (i < endIndexOfLine && currentStackIndex < stateStack.length) {
        const currentStateItem = stateStack[currentStackIndex]
        const currentHook = currentStateItem.hook
        const eatingInfo = calcEatingInfo()

        // Try to interrupt the current state.
        let interrupted = false
        for (const hook of hooks) {
          if (hook === currentHook) continue
          if (interruptSibling(hook, eatingInfo, currentStackIndex)) {
            interrupted = true
            break
          }
        }
        if (interrupted) break

        const result: ResultOfEatContinuationText = currentHook.eatContinuationText == null
          ? { status: 'notMatched' }
          : currentHook.eatContinuationText(
            nodePoints, eatingInfo, currentStateItem.state.data, parentState.data)

        if (result.status === 'failedAndRollback') {
          // Removed from parent state.
          parentState.children.pop()

          // Cut the stale branch from StateItem stack without call onClose.
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
          currentStackIndex -= 1
          moveForward(result.nextIndex, true)
          break
        } else if (result.status === 'opening') {
          moveForward(result.nextIndex, true)
        } else {
          throw new TypeError(
            `[eatContinuationText] unexpected status (${ (result as any).status }).`)
        }

        // Descend down the tree to the next unclosed node.
        currentStackIndex += 1
        parentState = currentStateItem.state
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
          // Try to eat a new inner block.
          let hasNewOpener = false
          const eatingInfo = calcEatingInfo()
          for (const hook of hooks) {
            if (
              hook.interruptableTypes.includes(lastChild.state.data.type) &&
              consumeNewOpener(hook, eatingInfo)
            ) {
              hasNewOpener = true
              break
            }
          }
          if (!hasNewOpener) return
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
     *        state.
     */
    const step3 = (): boolean => {
      if (
        i >= endIndexOfLine ||
        currentStackIndex + 1 >= stateStack.length
      ) return false

      const { hook, state } = stateStack[stateStack.length - 1]
      if (hook.eatLazyContinuationText == null) return false

      const { state: parentState } = stateStack[stateStack.length - 2]

      const eatingInfo = calcEatingInfo()
      const result = hook.eatLazyContinuationText(
        nodePoints, eatingInfo, state.data, parentState.data)
      switch (result.status) {
        case 'notMatched': {
          return false
        }
        case 'opening': {
          // Move forward and update position
          moveForward(result.nextIndex, true)

          // Lazy continuation text found, so move forward the currentStackIndex
          // to the top of the stateStack.
          currentStackIndex = stateStack.length - 1
          return true
        }
        default:
          throw new TypeError(
            `[eatLazyContinuationText] unexpected status (${ (result as any).status }).`)
      }
    }

    // Initialize the first non-whitespace index.
    moveForward(startIndexOfLine, false)

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
      ` startIndexOfLine(${ startIndexOfLine }), endIndexOfLine(${ endIndexOfLine })`
    )
  }

  /**
   * All the content has been processed and perform the final collation operation.
   */
  const done = (): BlockTokenizerContextMatchPhaseStateTree => {
    while (stateStack.length > 1) popup()
    return root
  }

  return {
    consume,
    done,
    shallowSnapshot: () => ([...stateStack]),
  }
}
