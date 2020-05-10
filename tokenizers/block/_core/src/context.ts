import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import { DataNodeTokenPointDetail } from '@yozora/tokenizer-core'
import produce from 'immer'
import {
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerContext,
  BlockTokenizerContextConstructorParams,
  BlockTokenizerEatingInfo,
  BlockTokenizerHook,
  BlockTokenizerHookAll,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateTree,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerParsePhaseStateTree,
  BlockTokenizerPhase,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreMatchPhaseStateTree,
  BlockTokenizerPreParsePhaseHook,
  BlockTokenizerPreParsePhaseState,
  InlineDataNodeParseFunc,
} from './types'


/**
 * 默认块状数据的分词器的上下文
 *
 * Default context of block tokenizer
 */
export class DefaultBlockTokenizerContext<M extends any = any>
  implements BlockTokenizerContext<M> {
  protected readonly fallbackTokenizer?: BlockTokenizer & Partial<BlockTokenizerHookAll>
  protected readonly parseInlineData?: InlineDataNodeParseFunc<M>

  protected readonly preMatchPhaseHooks: (
    BlockTokenizerPreMatchPhaseHook & BlockTokenizer)[]
  protected readonly preMatchPhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerPreMatchPhaseHook & BlockTokenizer>
  protected readonly matchPhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerMatchPhaseHook & BlockTokenizer>
  protected readonly transformMatchPhaseHooks: (
    BlockTokenizerPostMatchPhaseHook & BlockTokenizer)[]
  protected readonly preParsePhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerPreParsePhaseHook & BlockTokenizer>
  protected readonly parsePhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerParsePhaseHook & BlockTokenizer>

  public constructor(params: BlockTokenizerContextConstructorParams<M>) {
    this.fallbackTokenizer = params.fallbackTokenizer
    this.parseInlineData = params.parseInlineData
    this.preMatchPhaseHooks = []
    this.preMatchPhaseHookMap = new Map()
    this.matchPhaseHookMap = new Map()
    this.transformMatchPhaseHooks = []
    this.preParsePhaseHookMap = new Map()
    this.parsePhaseHookMap = new Map()

    if (this.fallbackTokenizer != null) {
      this.useTokenizer(this.fallbackTokenizer, ['pre-match'])
    }
  }

  /**
   *
   */
  public useTokenizer(
    tokenizer: BlockTokenizer & Partial<BlockTokenizerHook>,
    hookListSkippedPhase: BlockTokenizerPhase[] = [],
    hookMapSkippedPhase: BlockTokenizerPhase[] = [],
  ): void {
    const self = this
    const hook = produce(tokenizer, draftTokenizer => {
      if (self.parseInlineData != null) {
        // eslint-disable-next-line no-param-reassign
        draftTokenizer.parseInlineData = self.parseInlineData
      }
    }) as BlockTokenizer & BlockTokenizerHookAll

    /**
     * register into this.*Hooks
     */
    const registerIntoHookList = (
      phase: BlockTokenizerPhase,
      hooks: BlockTokenizer[],
    ) => {
      // skipped
      if (hookListSkippedPhase.includes(phase)) return

      let i = 0
      for (; i < hooks.length; ++i) {
        if (hooks[i].priority < hook.priority) break
      }
      hooks.splice(i, 0, hook)
    }

    /**
     * register into this.*HookMap
     */
    const registerIntoHookMap = (
      phase: BlockTokenizerPhase,
      hookMap: Map<BlockDataNodeType, BlockTokenizer>,
    ) => {
      // skipped
      if (hookMapSkippedPhase.includes(phase)) return

      for (const t of tokenizer.uniqueTypes) {
        if (hookMap.has(t)) {
          console.warn(
            '[DefaultBlockTokenizerContext.useTokenizer] tokenizer of type `'
            + t + '` has been registered in phase `' + phase + '`. skipped')
          continue
        }
        hookMap.set(t, hook)
      }
    }

    // pre-match phase
    if (hook.eatNewMarker != null) {
      registerIntoHookList('pre-match', self.preMatchPhaseHooks)
      registerIntoHookMap('pre-match', self.preMatchPhaseHookMap)
    }

    // match phase
    if (hook.match != null) {
      registerIntoHookMap('match', self.matchPhaseHookMap)
    }

    // post-match phase
    if (hook.transformMatch != null) {
      registerIntoHookList('post-match', self.transformMatchPhaseHooks)
    }

    // pre-parse phase
    if (hook.parseMeta != null) {
      registerIntoHookMap('pre-parse', self.preParsePhaseHookMap)
    }

    // parse phase
    if (hook.parseFlow != null) {
      registerIntoHookMap('parse', self.parsePhaseHookMap)
    }
  }

  /**
   * Called in pre-match phase
   */
  public preMatch(
    codePositions: DataNodeTokenPointDetail[],
    startIndex: number,
    endIndex: number,
  ): BlockTokenizerPreMatchPhaseStateTree {
    const self = this
    const preMatchPhaseStateTree: BlockTokenizerPreMatchPhaseStateTree = {
      type: 'root',
      opening: true,
      children: [],
    }

    const root = preMatchPhaseStateTree as BlockTokenizerPreMatchPhaseState
    for (let i = startIndex, lineEndIndex: number; i < endIndex; i = lineEndIndex) {
      // find the index of the end of current line
      for (lineEndIndex = i; lineEndIndex < endIndex; ++lineEndIndex) {
        if (codePositions[lineEndIndex].codePoint === AsciiCodePoint.LINE_FEED) {
          ++lineEndIndex
          break
        }
      }

      /**
       * 使用 firstNonWhiteSpaceIndex 记录当前行剩余内容中第一个非空白符的下标，
       * 使得 isBlankLine() 无论调用多少次，当前行中累计复杂度都是 O(lineEndIndex-i)
       *
       * Use firstNonWhiteSpaceIndex to record the index of the first non-whitespace
       * in the remaining content of the current line, so that no matter how many
       * times isBlankLine() is called, the cumulative complexity in the current line
       * is O(lineEndIndex-i)
       */
      let firstNonWhiteSpaceIndex = i
      const calcEatingInfo = (): BlockTokenizerEatingInfo => {
        while (firstNonWhiteSpaceIndex < lineEndIndex) {
          const c = codePositions[firstNonWhiteSpaceIndex]
          if (!isWhiteSpaceCharacter(c.codePoint)) break
          firstNonWhiteSpaceIndex += 1
        }
        return {
          startIndex: i,
          endIndex: lineEndIndex,
          firstNonWhiteSpaceIndex,
          isBlankLine: firstNonWhiteSpaceIndex >= lineEndIndex,
        }
      }

      /**
       * 往前移动到下一个匹配位置
       *
       * Move i forward to the next starting match position
       * @param nextIndex next matching position
       */
      const moveToNext = (nextIndex: number) => {
        i = nextIndex
        firstNonWhiteSpaceIndex = Math.max(firstNonWhiteSpaceIndex, nextIndex)
      }

      /**
       * Step 1: First we iterate through the open blocks, starting with the
       *         root document, and descending through last children down to
       *         the last open block. Each block imposes a condition that the
       *         line must satisfy if the block is to remain open.
       * @see https://github.github.com/gfm/#phase-1-block-structure
       */
      let parent = root
      if (parent.children != null && parent.children.length > 0) {
        let openedState = parent.children[parent.children.length - 1]
        while (openedState.opening) {
          const tokenizer = self.preMatchPhaseHookMap.get(openedState.type)
          if (tokenizer == null) {
            throw new TypeError(`[pre-match] no tokenizer matched \`${ openedState.type }\` found`)
          }

          let nextIndex = -1
          const eatingInfo = calcEatingInfo()

          /**
           * Try to interrupt eatContinuationText
           */
          let interrupted = false
          for (const iTokenizer of self.preMatchPhaseHooks) {
            if (iTokenizer.priority < tokenizer.priority) break
            if (iTokenizer.eatAndInterruptPreviousSibling == null) continue
            const nextSiblingEatingResult = iTokenizer.eatAndInterruptPreviousSibling(
              codePositions, eatingInfo, parent, openedState)
            if (nextSiblingEatingResult == null) continue

            /**
             * Successful interrupt
             *  - Remove/Close previous sibling state
             *  - Continue processing with the new state
             */
            if (nextSiblingEatingResult.shouldRemovePreviousSibling) {
              parent.children!.pop()
            } else {
              self.recursivelyClosePreMatchState(openedState, true)
            }
            nextIndex = nextSiblingEatingResult.nextIndex
            openedState = nextSiblingEatingResult.nextState || nextSiblingEatingResult.state
            parent.children!.push(openedState)
            interrupted = true
            break
          }

          /**
           * Not be interrupted
           */
          if (!interrupted && tokenizer.eatContinuationText != null) {
            nextIndex = tokenizer.eatContinuationText(
              codePositions, eatingInfo, openedState)
          }

          /**
           * Move forward if continuation text matched, otherwise, end step1
           */
          if (nextIndex < i) break
          moveToNext(nextIndex)

          // descending through last children down to the next open block
          parent = openedState
          if (openedState.children == null || openedState.children.length <= 0) break
          const lastChild = openedState.children[openedState.children.length - 1]
          openedState = lastChild
        }
      }

      /**
       * Step 2: Next, after consuming the continuation markers for existing blocks,
       *         we look for new block starts (e.g. > for a block quote)
       */
      let newTokenMatched = false
      for (; i < lineEndIndex && parent.children != null;) {
        const currentIndex = i
        let parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
        for (const tokenizer of self.preMatchPhaseHooks) {
          const eatingInfo = calcEatingInfo()
          const eatingResult = tokenizer.eatNewMarker(codePositions, eatingInfo, parent)
          if (eatingResult == null) continue

          // The marker of the new data node cannot be empty
          if (eatingResult.nextIndex <= i) break

          // Move forward
          moveToNext(eatingResult.nextIndex)

          /**
           * 检查新的节点是否被 parent 所接受，若不接受，则关闭 parent 并
           * 沿祖先链往上遍历，直到找到一个接收此新节点的祖先节点或到达根节点
           *
           * Check if the new node is accepted by parent, if not, close parent
           * and traverse the ancestor chain until it finds an ancestor node
           * that receives this new node or be fallback to the root node
           */
          while (parentTokenizer != null) {
            if (parentTokenizer.shouldAcceptChild == null) break
            if (parentTokenizer.shouldAcceptChild(parent, eatingResult.state)) break
            self.recursivelyClosePreMatchState(parent, true)

            parent = parent.parent
            parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
          }

          /**
           * If we encounter a new block start, we close any blocks unmatched
           * in step 1 before creating the new block as a child of the last matched block
           */
          if (!newTokenMatched) {
            newTokenMatched = true
            self.recursivelyClosePreMatchState(parent, false)
          }

          // Before accept child
          if (parentTokenizer != null && parentTokenizer.beforeAcceptChild != null) {
            parentTokenizer.beforeAcceptChild(parent, eatingResult.state)
          }

          parent.children!.push(eatingResult.state)
          parent = eatingResult.nextState || eatingResult.state
          break
        }
        if (currentIndex === i) break
      }

      /**
       * 本行没有剩余内容，提前结束匹配，并关闭未匹配到的块
       * There is no remaining content in this bank, end the match in advance,
       * and close the unmatched opening blocks
       */
      if (i >= lineEndIndex) {
        if (!newTokenMatched) {
          self.recursivelyClosePreMatchState(parent, false)
        }
        continue
      }

      /**
       * Step 3: Finally, we look at the remainder of the line (after block
       *         markers like >, list markers, and indentation have been consumed).
       *         This is text that can be incorporated into the last open block
       *         (a paragraph, code block, heading, or raw HTML).
       */
      let lastChild: BlockTokenizerPreMatchPhaseState = parent
      while (lastChild.children != null && lastChild.children.length > 0) {
        lastChild = lastChild.children[lastChild.children.length - 1]
      }
      if (lastChild.opening) {
        let continuationTextMatched = false
        const tokenizer = self.preMatchPhaseHookMap.get(lastChild.type)
        if (tokenizer != null && tokenizer.eatLazyContinuationText != null) {
          const eatingInfo = calcEatingInfo()
          const nextIndex = tokenizer
            .eatLazyContinuationText(codePositions, eatingInfo, lastChild)
          if (nextIndex >= 0) {
            continuationTextMatched = true
            moveToNext(nextIndex)
          }
        }
        if (!continuationTextMatched) {
          self.recursivelyClosePreMatchState(parent, false)
        }
      }

      /**
       * There is still unknown content, close unmatched blocks and use FallbackTokenizer
       */
      if (firstNonWhiteSpaceIndex < lineEndIndex) {
        self.recursivelyClosePreMatchState(parent, false)
        let parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
        if (
          self.fallbackTokenizer != null
          && self.fallbackTokenizer.eatNewMarker != null
          && parent.children != null
        ) {
          const eatingInfo = calcEatingInfo()
          const eatingResult = self.fallbackTokenizer
            .eatNewMarker(codePositions, eatingInfo, parent)
          if (eatingResult != null && eatingResult.nextIndex > i) {
            // Move forward
            moveToNext(eatingResult.nextIndex)

            /**
             * 检查新的节点是否被 parent 所接受，若不接受，则关闭 parent 并
             * 沿祖先链往上遍历，直到找到一个接收此新节点的祖先节点或到达根节点
             *
             * Check if the new node is accepted by parent, if not, close parent
             * and traverse the ancestor chain until it finds an ancestor node
             * that receives this new node or be fallback to the root node
             */
            while (parentTokenizer != null) {
              if (parentTokenizer.shouldAcceptChild == null) break
              if (parentTokenizer.shouldAcceptChild(parent, eatingResult.state)) break
              self.recursivelyClosePreMatchState(parent, true)

              parent = parent.parent
              parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
            }

            // before accept child
            if (parentTokenizer != null && parentTokenizer.beforeAcceptChild != null) {
              parentTokenizer.beforeAcceptChild(parent, eatingResult.state)
            }
            parent.children!.push(eatingResult.state)
            moveToNext(eatingResult.nextIndex)
          }
        }
      }
    }

    self.recursivelyClosePreMatchState(root, true)
    return preMatchPhaseStateTree
  }

  /**
   * Called in match phase
   */
  public match(
    preMatchPhaseStateTree: BlockTokenizerPreMatchPhaseStateTree,
  ): BlockTokenizerMatchPhaseStateTree {
    const self = this
    const matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree = {
      type: 'root',
      meta: [],
      children: [],
      classify: 'flow',
    }

    const handle = (
      u: BlockTokenizerPreMatchPhaseState,
      v: BlockTokenizerMatchPhaseState,
    ): void => {
      if (u.children == null) return
      // eslint-disable-next-line no-param-reassign
      v.children = []

      // Perform matchHooks
      for (const uo of u.children) {
        const hook = self.matchPhaseHookMap.get(uo.type)
        // cannot find matched tokenizer
        if (hook == null) {
          throw new TypeError(`[match] no tokenizer matched \`${ uo.type }\` found`)
        }
        const vo = hook.match(uo)

        // ignored
        if (vo === false) continue

        // formatted
        v.children.push(vo)

        // recursive handle
        handle(uo, vo)
      }
    }

    handle(preMatchPhaseStateTree as BlockTokenizerPreMatchPhaseState, matchPhaseStateTree)
    return matchPhaseStateTree
  }

  /**
   * Called in post-match phase
   */
  public postMatch(
    matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerMatchPhaseStateTree {
    const self = this

    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (
      o: BlockTokenizerMatchPhaseState,
      metaDataNodes: BlockTokenizerMatchPhaseState[],
    ): void => {
      if (o.children != null && o.children.length > 0) {
        for (const u of o.children) handle(u, metaDataNodes)

        // Post-order recursive to perform postMatchHooks
        let originalPreviousSiblingState: BlockTokenizerMatchPhaseState | undefined
        const flowDataNodes: BlockTokenizerMatchPhaseState[] = []
        for (const u of o.children) {
          let x: BlockTokenizerMatchPhaseState | null = u
          for (const hook of self.transformMatchPhaseHooks) {
            const v = hook.transformMatch(u, originalPreviousSiblingState)
            // do nothing
            if (v == null) continue

            // remove
            if (v === false) {
              x = null
              break
            }

            // replace
            x = v
            break
          }

          if (x != null) {
            switch (x.classify) {
              case 'flow':
                flowDataNodes.push(x)
                originalPreviousSiblingState = x
                break
              case 'meta':
                metaDataNodes.push(x)
                break
            }
          }
        }

        // eslint-disable-next-line no-param-reassign
        o.children = flowDataNodes
      }
    }

    // modify into immer, to make the state traceable
    const result = produce(matchPhaseStateTree, draftTree => {
      const metaDataNodes: BlockTokenizerMatchPhaseState[] = []
      handle(draftTree, metaDataNodes)
      // eslint-disable-next-line no-param-reassign
      draftTree.meta = metaDataNodes
    })
    return result
  }

  /**
   * Called in pre-parse phase
   */
  public preParse(
    matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerPreParsePhaseState<M> {
    const self = this
    const preParsePhaseState: BlockTokenizerPreParsePhaseState = {
      meta: {},
    }

    const rawMeta = {}
    for (const o of matchPhaseStateTree.meta) {
      const metaData = preParsePhaseState.meta[o.type] || []
      metaData.push(o)
      rawMeta[o.type] = metaData
    }

    // Perform parseMetaHooks
    for (const t of Object.keys(rawMeta)) {
      const hook = self.preParsePhaseHookMap.get(t)
      // cannot find matched tokenizer
      if (hook == null) {
        throw new TypeError(`[parseMeta] no tokenizer matched \`${ t }\` found`)
      }

      const states = rawMeta[t]
      const vo = hook.parseMeta(states)
      preParsePhaseState.meta[t] = vo
    }
    return preParsePhaseState as BlockTokenizerPreParsePhaseState<M>
  }

  /**
   * Called in parse phase
   */
  public parse(
    matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree,
    preParsePhaseState: BlockTokenizerPreParsePhaseState<M>,
  ): BlockTokenizerParsePhaseStateTree<M> {
    const self = this
    const parsePhaseStateTree: BlockTokenizerParsePhaseStateTree<M> = {
      type: 'root',
      meta: preParsePhaseState.meta,
      children: [],
    }

    const handle = (
      u: BlockTokenizerMatchPhaseState,
      v: BlockTokenizerParsePhaseState,
    ): void => {
      if (u.children == null) return
      // eslint-disable-next-line no-param-reassign
      v.children = []

      // Perform parseFlowHooks
      for (const uo of u.children) {
        const hook = self.parsePhaseHookMap.get(uo.type)
        // cannot find matched tokenizer
        if (hook == null) {
          throw new TypeError(`[parseFlow] no tokenizer matched \`${ uo.type }\` found`)
        }

        const vo = hook.parseFlow(uo, preParsePhaseState)
        v.children.push(vo)

        // Pre-order recursive handle
        handle(uo, vo)
      }
    }

    handle(matchPhaseStateTree, parsePhaseStateTree)
    return parsePhaseStateTree
  }

  /**
   * 递归关闭未匹配到状态处于 opening 的块
   * Recursively close unmatched opening blocks
   *
   * @param state
   * @param shouldCloseCurrentState
   */
  protected recursivelyClosePreMatchState(
    state: BlockTokenizerPreMatchPhaseState,
    shouldCloseCurrentState: boolean
  ): void {
    const self = this
    if (!state.opening) return
    if (state.children != null && state.children.length > 0) {
      // Post-order recursive close
      self.recursivelyClosePreMatchState(state.children[state.children.length - 1], true)
    }

    if (shouldCloseCurrentState) {
      const tokenizer = self.preMatchPhaseHookMap.get(state.type)
      if (tokenizer != null && tokenizer.eatEnd != null) {
        tokenizer.eatEnd(state)
      }

      // eslint-disable-next-line no-param-reassign
      state.opening = false
    }
  }
}
