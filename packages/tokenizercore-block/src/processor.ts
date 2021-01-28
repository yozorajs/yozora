import type {
  EnhancedYastNodePoint,
  YastNodePoint,
} from '@yozora/tokenizercore'
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
} from './types/tokenizer'
import invariant from 'tiny-invariant'
import { isWhiteSpaceCharacter } from '@yozora/character'
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
 * Process raw contents into BlockTokenizerContextMatchPhaseStateTree.
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
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
  fallbackHook: FallbackBlockTokenizer & Hook,
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
    hook: { isContainer: true } as unknown as Hook,
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
   * Pop the top element up from the StateItem stack.
   * @param item
   */
  const popup = (): StateItem | undefined => {
    const topState = stateStack.pop()
    if (currentStackIndex >= stateStack.length) {
      currentStackIndex = stateStack.length - 1
    }

    if (topState == null) return topState

    // Call the `onClose()` hook.
    if (topState.hook.onClose != null) {
      topState.hook.onClose(topState.state.data)
    }
    return topState
  }

  /**
   * Pop the top element up from the StateItem stack.
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
   * Re-process rollback lines.
   * @param lines
   */
  const rollback = (hook: Hook, lines: PhrasingContentLine[]): boolean => {
    if (lines.length <= 0) return false

    const parent = stateStack[currentStackIndex]
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

    const innerStateStack = processor.shallowSnapshot()

    // Refresh the ancient nodes position.
    const innerRoot = innerStateStack[0]
    parent.state.children.push(...innerRoot.state.children)
    refreshPosition(innerRoot.state.position.end)

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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    startIndexOfLine: number,
    endIndexOfLine: number,
    _firstNonWhitespaceIndex: number = startIndexOfLine,
  ): void => {
    let i = startIndexOfLine, firstNonWhitespaceIndex = _firstNonWhitespaceIndex

    /**
     * Generate eating line info from current start position.
     */
    const calcEatingInfo = (): EatingLineInfo => {
      return {
        startIndex: i,
        endIndex: endIndexOfLine,
        firstNonWhitespaceIndex,
      }
    }

    /**
     * Update the `i` to the next start index.
     * @param nextIndex   the next start index.
     */
    const moveForward = (nextIndex: number): void => {
      invariant(
        i <= nextIndex,
        `[DBTContext#moveForward] nextIndex(${ nextIndex }) is behind i(${ i }).`
      )

      i = nextIndex
      if (firstNonWhitespaceIndex > nextIndex) return

      firstNonWhitespaceIndex = nextIndex
      while (firstNonWhitespaceIndex < endIndexOfLine) {
        const p = nodePoints[firstNonWhitespaceIndex]
        if (!isWhiteSpaceCharacter(p.codePoint)) break
        firstNonWhitespaceIndex += 1
      }
    }

    /**
     * Try to Consume nodePoints with a new opener.
     * @param hook
     */
    const consumeNewOpener = (hooks: Hook[]): boolean => {
      const { state: parentState } = stateStack[currentStackIndex]
      const eatingInfo = calcEatingInfo()
      for (const hook of hooks) {
        const result = hook.eatOpener(nodePoints, eatingInfo, parentState.data)
        if (result == null) continue

        // The marker of the new data node cannot be empty.
        invariant(
          result.nextIndex > i,
          '[BlockContentProcessor#consumeNewOpener] The marker of the new data node cannot be empty.\n' +
          ` type(${ result.state.type })`
        )

        // Move forward
        moveForward(result.nextIndex)

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
      return false
    }

    /**
     * Try to interrupt previous sibling state.
     * @param hooks
     */
    const interruptSibling = (hooks: Hook[]): boolean => {
      if (currentStackIndex <= 0) return false

      const eatingInfo = calcEatingInfo()
      const { state: lastState } = stateStack[currentStackIndex]
      const { state: parentState } = stateStack[currentStackIndex - 1]

      for (const hook of hooks) {
        if (!hook.interruptableTypes.includes(lastState.data.type)) continue

        let result: ResultOfEatAndInterruptPreviousSibling = null
        if (hook.eatAndInterruptPreviousSibling != null) {
          // try `eatAndInterruptPreviousSibling` first
          result = hook.eatAndInterruptPreviousSibling(
            nodePoints, eatingInfo, lastState.data, parentState.data)
          if (result == null) continue

        } else {
          // Then try `eatOpener`
          result = hook.eatOpener(nodePoints, eatingInfo, parentState.data)
        }

        if (result == null) continue

        // Successfully interrupt the previous node.
        cutStaleBranch(true)

        // Remove previous sibling from its parent.
        if (result.shouldRemovePreviousSibling) {
          parentState.children.pop()
        }

        // Move forward
        moveForward(result.nextIndex)

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
      return false
    }

    /**
     * Step 1: First we iterate through the open blocks, starting with the
     *         root document, and descending through last children down to
     *         the last open block. Each block imposes a condition that the
     *         line must satisfy if the block is to remain open.
     * @see https://github.github.com/gfm/#phase-1-block-structure
     */
    const step1 = (): void => {
      // The root container block always successfully matches the continuation text.
      if (stateStack.length < 2) {
        currentStackIndex = 0
        return
      }

      // Reset current stack index to 1.
      currentStackIndex = 1

      let { state: parentState } = stateStack[currentStackIndex - 1]
      while (i < endIndexOfLine && currentStackIndex < stateStack.length) {
        // Try to interrupt the last state.
        if (currentStackIndex > 0) {
          if (interruptSibling(hooks)) break
        }

        const { hook, state } = stateStack[currentStackIndex]
        if (hook.eatContinuationText == null) break

        const eatingInfo = calcEatingInfo()
        const result = hook.eatContinuationText(
          nodePoints, eatingInfo, state.data, parentState.data)

        if (result.failed) {
          // Removed from parent state.
          parentState.children.pop()

          // Cut the stale branch from StateItem stack without call onClose.
          stateStack.length = currentStackIndex
          currentStackIndex -= 1

          if (result.lines.length > 0) {
            if (rollback(hook, result.lines)) continue
          }
          break
        }

        // Move forward and update position
        if (result.nextIndex != null) {
          moveForward(result.nextIndex)
          const endPoint = calcEndYastNodePoint(nodePoints, result.nextIndex - 1)
          refreshPosition(endPoint)
        }

        // If saturated (not failed), make currentStackIndex point to its parent.
        if (result.saturated) {
          currentStackIndex -= 1

          if (result.lines != null && result.lines.length > 0) {
            // Cut the stale branch before rollback.
            cutStaleBranch(false)

            // Rollback the give liens.
            if (rollback(hook, result.lines)) continue
          }
          break
        }

        // Otherwise, descend down the tree to the next unclosed node.
        currentStackIndex += 1
        parentState = state
      }

      // Reset currentStackIndex pointer to the last opening state.
      if (currentStackIndex >= stateStack.length) {
        currentStackIndex = stateStack.length - 1
      }
    }

    /**
     * Step 2: Next, after consuming the continuation markers for existing
     *         blocks, we look for new block starts (e.g. > for a block quote)
     */
    const step2 = (): void => {
      while (i < endIndexOfLine) {
        // Try to eat a new inner block.
        const { hook: lastHook } = stateStack[currentStackIndex]
        if (lastHook.isContainer) {
          if (consumeNewOpener(hooks)) continue
        }

        // fallback
        break
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
      if (result.nextIndex == null) return false

      // Move forward and update position
      moveForward(result.nextIndex)
      const endPoint = calcEndYastNodePoint(nodePoints, result.nextIndex - 1)
      refreshPosition(endPoint)

      // Lazy continuation text found, so move forward the currentStackIndex
      // to the top of the stateStack.
      currentStackIndex = stateStack.length - 1
      if (result.saturated) popup()
      return true
    }

    // Initialize the first non-whitespace index.
    moveForward(i)

    step1()
    step2()

    // No lazy continuation text found, so closed the stale branch.
    if (!step3()) {
      cutStaleBranch(false)
    }

    // Try fallback tokenizer
    if (i < endIndexOfLine) {
      consumeNewOpener([fallbackHook])
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
