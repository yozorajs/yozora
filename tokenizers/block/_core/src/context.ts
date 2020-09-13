import { produce } from 'immer'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import {
  DataNodeTokenPointDetail,
  eatOptionalWhiteSpaces,
} from '@yozora/tokenizercore'
import {
  BlockDataNodeMetaData,
  BlockDataNodeType,
  BlockTokenizer,
  BlockTokenizerContext,
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
  BlockTokenizerPostParsePhaseHook,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreMatchPhaseStateTree,
  BlockTokenizerPreParsePhaseHook,
  BlockTokenizerPreParsePhaseState,
  EatingLineInfo,
  FallbackBlockTokenizer,
} from './types'


export interface  DefaultBlockTokenizerContextParams {
  /**
   *
   */
  readonly fallbackTokenizer: FallbackBlockTokenizer
}


/**
 * 默认块状数据的分词器的上下文
 *
 * Default context of block tokenizer
 */
export class DefaultBlockTokenizerContext<
  M extends BlockDataNodeMetaData = BlockDataNodeMetaData>
  implements BlockTokenizerContext<M> {
  protected readonly fallbackTokenizer: FallbackBlockTokenizer
  protected readonly preMatchPhaseHooks: (
    BlockTokenizerPreMatchPhaseHook & BlockTokenizer)[]
  protected readonly preMatchPhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerPreMatchPhaseHook & BlockTokenizer>
  protected readonly matchPhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerMatchPhaseHook & BlockTokenizer>
  protected readonly postMatchPhaseHooks: (
    BlockTokenizerPostMatchPhaseHook & BlockTokenizer)[]
  protected readonly preParsePhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerPreParsePhaseHook & BlockTokenizer>
  protected readonly parsePhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerParsePhaseHook & BlockTokenizer>
  protected readonly postParsePhaseHooks: (
    BlockTokenizerPostParsePhaseHook & BlockTokenizer)[]

  public constructor(params: DefaultBlockTokenizerContextParams) {
    this.fallbackTokenizer = params.fallbackTokenizer
    this.preMatchPhaseHooks = []
    this.preMatchPhaseHookMap = new Map()
    this.matchPhaseHookMap = new Map()
    this.postMatchPhaseHooks = []
    this.preParsePhaseHookMap = new Map()
    this.parsePhaseHookMap = new Map()
    this.postParsePhaseHooks = []

    const fallbackTokenizer = this.fallbackTokenizer as FallbackBlockTokenizer & BlockTokenizerHookAll
    this.registerIntoHookMap(fallbackTokenizer, 'pre-match', this.preMatchPhaseHookMap, {})
    this.registerIntoHookMap(fallbackTokenizer, 'match', this.matchPhaseHookMap, {})
    this.registerIntoHookMap(fallbackTokenizer, 'parse', this.parsePhaseHookMap, {})
  }

  /**
   *
   */
  public useTokenizer(
    tokenizer: BlockTokenizer & Partial<BlockTokenizerHook>,
    lifecycleFlags: Partial<Record<BlockTokenizerPhase, false>> = {},
  ): this {
    const self = this
    const hook = tokenizer as BlockTokenizer & BlockTokenizerHookAll

    // pre-match phase
    if (hook.eatNewMarker != null) {
      self.registerIntoHookList(hook, 'pre-match', self.preMatchPhaseHooks, lifecycleFlags)
      self.registerIntoHookMap(hook, 'pre-match', self.preMatchPhaseHookMap, lifecycleFlags)
    }

    // match phase
    if (hook.match != null) {
      self.registerIntoHookMap(hook, 'match', self.matchPhaseHookMap, lifecycleFlags)
    }

    // post-match phase
    if (hook.transformMatch != null) {
      self.registerIntoHookList(hook, 'post-match', self.postMatchPhaseHooks, lifecycleFlags)
    }

    // pre-parse phase
    if (hook.parseMeta != null) {
      self.registerIntoHookMap(hook, 'pre-parse', self.preParsePhaseHookMap, lifecycleFlags)
    }

    // parse phase
    if (hook.parseFlow != null) {
      self.registerIntoHookMap(hook, 'parse', self.parsePhaseHookMap, lifecycleFlags)
    }

    // post-parse
    if (hook.transformParse != null) {
      self.registerIntoHookList(hook, 'post-parse', self.postParsePhaseHooks, lifecycleFlags)
    }

    return self
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

    for (
      let lineNo = 1, i = startIndex, lineEndIndex: number;
      i < endIndex;
      lineNo += 1, i = lineEndIndex
    ) {
      // find the index of the end of current line
      for (lineEndIndex = i; lineEndIndex < endIndex; ++lineEndIndex) {
        if (codePositions[lineEndIndex].codePoint === AsciiCodePoint.LINE_FEED) {
          lineEndIndex += 1
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
      const calcEatingInfo = (): EatingLineInfo => {
        eatOptionalWhiteSpaces(codePositions, startIndex, endIndex)
        while (firstNonWhiteSpaceIndex < lineEndIndex) {
          const c = codePositions[firstNonWhiteSpaceIndex]
          if (!isWhiteSpaceCharacter(c.codePoint)) break
          firstNonWhiteSpaceIndex += 1
        }
        return {
          lineNo,
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
       * append child to parent
       * @param nextState
       */
      const appendChild = (nextState: BlockTokenizerPreMatchPhaseState): void => {
        // Recursively close this state if it's saturated
        if (nextState.saturated) {
          self.closeDescendantOfPreMatchPhaseState(nextState, true)
        }

        /**
         * 检查新的节点是否被 parent 所接受，若不接受，则关闭 parent 并
         * 沿祖先链往上遍历，直到找到一个接收此新节点的祖先节点或到达根节点
         *
         * Check if the new node is accepted by parent, if not, close parent
         * and traverse the ancestor chain until it finds an ancestor node
         * that receives this new node or be fallback to the root node
         */
        let parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
        while (parentTokenizer != null) {
          if (parentTokenizer.shouldAcceptChild == null) break
          if (parentTokenizer.shouldAcceptChild(parent, nextState)) break
          self.closeDescendantOfPreMatchPhaseState(parent, true)

          parent = parent.parent
          parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
        }

        // before accept child
        if (parentTokenizer != null && parentTokenizer.beforeAcceptChild != null) {
          parentTokenizer.beforeAcceptChild(parent, nextState)
        }
        parent.children!.push(nextState)
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
            const eatAndInterruptResult = iTokenizer.eatAndInterruptPreviousSibling(
              codePositions, eatingInfo, parent, openedState)
            if (eatAndInterruptResult == null) continue

            /**
             * Successful interrupt
             *  - Remove/Close previous sibling state
             *  - Continue processing with the new state
             */
            if (eatAndInterruptResult.shouldRemovePreviousSibling) {
              parent.children!.pop()
            }

            const nextState = eatAndInterruptResult.state
            appendChild(nextState)
            openedState = nextState
            interrupted = true
            nextIndex = eatAndInterruptResult.nextIndex
            break
          }

          /**
           * Not be interrupted
           */
          if (!interrupted && tokenizer.eatContinuationText != null) {
            const eatContinuationResult = tokenizer.eatContinuationText(
              codePositions, eatingInfo, openedState)
            if (eatContinuationResult != null) {
              switch (eatContinuationResult.resultType) {
                case 'continue': {
                  const { state: nextState } = eatContinuationResult

                  // If saturated, close current state
                  if (nextState != null && nextState.saturated) {
                    self.closeDescendantOfPreMatchPhaseState(nextState, true)
                  }

                  nextIndex = eatContinuationResult.nextIndex
                  parent.children!.pop()
                  appendChild(nextState)
                  openedState = nextState
                  break
                }
                case 'finished': {
                  const { state: nextState } = eatContinuationResult

                  nextIndex = eatContinuationResult.nextIndex
                  parent.children!.pop()
                  openedState = parent.children![parent.children!.length - 1]

                  /**
                   * If eatContinuationResult.state is not null, push it back
                   * of parent.children
                   */
                  if (nextState != null) {
                    appendChild(nextState)
                  }

                  self.closeDescendantOfPreMatchPhaseState(parent, false)
                  if (eatContinuationResult.lines.length > 0) {
                    const fallbackState = self.fallbackTokenizer.createPreMatchPhaseState(
                      true, parent, eatContinuationResult.lines)
                    appendChild(fallbackState)
                  }

                  // Re-parsing this line
                  openedState = parent
                  parent = parent.parent
                  break
                }
              }
            }
          }

          /**
           * Move forward if continuation text matched, otherwise, end step1
           */
          if (nextIndex < i) break
          moveToNext(nextIndex)

          // descending through last child down to the next open block
          parent = openedState
          if (
            openedState.opening === false ||
            openedState.children == null ||
            openedState.children.length <= 0
          ) break
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
        for (const tokenizer of self.preMatchPhaseHooks) {
          const eatingInfo = calcEatingInfo()
          const eatingResult = tokenizer.eatNewMarker(codePositions, eatingInfo, parent)
          if (eatingResult == null) continue

          // The marker of the new data node cannot be empty
          if (eatingResult.nextIndex <= i) break

          // Move forward
          moveToNext(eatingResult.nextIndex)

          /**
           * If we encounter a new block start, we close any blocks unmatched
           * in step 1 before creating the new block as a child of the last matched block
           */
          if (!newTokenMatched) {
            newTokenMatched = true
            self.closeDescendantOfPreMatchPhaseState(parent, false)
          }

          appendChild(eatingResult.state)
          parent = eatingResult.state
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
          self.closeDescendantOfPreMatchPhaseState(parent, false)
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
          const lazyContinuationTextResult = tokenizer
            .eatLazyContinuationText(codePositions, eatingInfo, lastChild)
          if (lazyContinuationTextResult != null) {
            continuationTextMatched = true
            moveToNext(lazyContinuationTextResult.nextIndex)
            if (lazyContinuationTextResult.state.saturated) {
              self.closeDescendantOfPreMatchPhaseState(lastChild, true)
            }
          }
        }
        if (!continuationTextMatched) {
          self.closeDescendantOfPreMatchPhaseState(parent, false)
        }
      }

      /**
       * There is still unknown content, close unmatched blocks and use FallbackTokenizer
       */
      if (firstNonWhiteSpaceIndex < lineEndIndex) {
        self.closeDescendantOfPreMatchPhaseState(parent, false)
        if (parent.children != null) {
          const eatingInfo = calcEatingInfo()
          const eatingResult = self.fallbackTokenizer
            .eatNewMarker(codePositions, eatingInfo, parent)
          if (eatingResult != null && eatingResult.nextIndex > i) {
            moveToNext(eatingResult.nextIndex)
            appendChild(eatingResult.state)
          }
        }
      }
    }

    self.closeDescendantOfPreMatchPhaseState(root, true)
    return preMatchPhaseStateTree
  }

  /**
   * Called in match phase
   */
  public match(
    preMatchPhaseStateTree: BlockTokenizerPreMatchPhaseStateTree,
  ): BlockTokenizerMatchPhaseStateTree {
    const self = this

    const handle = (
      preMatchState: BlockTokenizerPreMatchPhaseState,
    ): BlockTokenizerMatchPhaseState | null => {
      const children: BlockTokenizerMatchPhaseState[] = []
      if (preMatchState.children != null) {
        for (const u of preMatchState.children) {
          const v = handle(u)
          if (v == null) continue
          children.push(v)
        }
      }

      const hook = self.matchPhaseHookMap.get(preMatchState.type)
      // cannot find matched tokenizer
      if (hook == null) {
        throw new TypeError(`[match] no tokenizer matched \`${ preMatchState.type }\` found`)
      }

      const matchState = hook.match(preMatchState, children)
      return matchState
    }

    const children: BlockTokenizerMatchPhaseState[] = []
    for (const u of preMatchPhaseStateTree.children) {
      const v = handle(u)
      if (v == null) continue
      children.push(v)
    }

    const matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree = {
      type: 'root',
      classify: 'flow',
      meta: [],
      children,
    }
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

        // Post-order handle: Perform BlockTokenizerPostMatchPhaseHook
        let states = o.children
        for (const hook of self.postMatchPhaseHooks) {
          states = hook.transformMatch(states)
        }

        const flowDataNodes: BlockTokenizerMatchPhaseState[] = []
        for (const x of states) {
          switch (x.classify) {
            case 'flow':
              flowDataNodes.push(x)
              break
            case 'meta':
              metaDataNodes.push(x)
              break
          }
        }

        // eslint-disable-next-line no-param-reassign
        o.children = flowDataNodes
      }
    }

    // modify into immer, to make the state traceable
    const metaDataNodes: BlockTokenizerMatchPhaseState[] = []
    handle(matchPhaseStateTree, metaDataNodes)
    // eslint-disable-next-line no-param-reassign
    matchPhaseStateTree.meta = metaDataNodes
    return matchPhaseStateTree

    // // modify into immer, to make the state traceable
    // const result = produce(matchPhaseStateTree, draftTree => {
    //   const metaDataNodes: BlockTokenizerMatchPhaseState[] = []
    //   handle(draftTree, metaDataNodes)
    //   // eslint-disable-next-line no-param-reassign
    //   draftTree.meta = metaDataNodes
    // })
    // return result
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
      const metaData = rawMeta[o.type] || []
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

    /**
     * parse BlockTokenizerMatchPhaseState to BlockTokenizerParsePhaseState
     */
    const handle = (
      o: BlockTokenizerMatchPhaseState,
    ): BlockTokenizerParsePhaseState | null => {
      // Post-order handle: But first check the validity of the current node
      const hook = self.parsePhaseHookMap.get(o.type)

      // cannot find matched tokenizer
      if (hook == null) {
        throw new TypeError(`[parseFlow] no tokenizer matched \`${ o.type }\` found`)
      }

      // Post-order handle: Prioritize child nodes
      let children: BlockTokenizerParsePhaseState[] | undefined
      if (o.children != null) {
        children = []
        for (const u of o.children) {
          const v = handle(u)
          if (v == null) continue
          children.push(v)
        }
      }

      // Post-order handle: Perform BlockTokenizerParsePhaseHook
      const x = hook.parseFlow(o, preParsePhaseState, children)
      return x
    }

    const children = matchPhaseStateTree.children
      .map(handle)
      .filter((x): x is BlockTokenizerParsePhaseState => x != null)
    const parsePhaseStateTree: BlockTokenizerParsePhaseStateTree<M> = {
      type: 'root',
      meta: preParsePhaseState.meta,
      children,
    }
    return parsePhaseStateTree
  }

  /**
   * Called in post-parse phase
   */
  public postParse(
    parsePhaseStateTree: BlockTokenizerParsePhaseStateTree<M>
  ): BlockTokenizerParsePhaseStateTree<M> {
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
      o: BlockTokenizerParsePhaseState,
      metaDataNodes: BlockTokenizerMatchPhaseState[],
    ): void => {
      if (o.children != null && o.children.length > 0) {
        for (const u of o.children) handle(u, metaDataNodes)

        // Post-order handle: Perform BlockTokenizerPostMatchPhaseHook
        let states = o.children
        for (const hook of self.postParsePhaseHooks) {
          states = hook.transformParse(parsePhaseStateTree.meta, states)
        }

        // eslint-disable-next-line no-param-reassign
        o.children = states
      }
    }

    // modify into immer, to make the state traceable
    const result = produce(parsePhaseStateTree, draftTree => {
      const metaDataNodes: BlockTokenizerMatchPhaseState[] = []
      handle(draftTree, metaDataNodes)
    })
    return result
  }

  /**
   * Close all descendant nodes of state (including state itself only when the
   * shouldCloseItself is true).
   *
   * The closing action is carried out from bottom to top. For those descendant
   * nodes whose opening is false, this closing action is not executed deep
   * into its subtree. And for all visited nodes, only the nodes whose opening
   * is true will be performed the cleaning operation.
   *
   * It is worth noting that we can assume that those nodes whose opening is
   * true are always ranked to the right of their sibling nodes (because the
   * nodes on the left are always resolved first)
   * @param state
   */
  protected closeDescendantOfPreMatchPhaseState(
    state: BlockTokenizerPreMatchPhaseState,
    shouldCloseItself: boolean
  ): void {
    const self = this

    if (state.children != null && state.children.length > 0) {
      // Optimization: we don't have to traverse all the child nodes,
      // but just find all the nodes on the right that have opening true
      let firstOpeningNodeIndex = state.children.length - 1
      for (; firstOpeningNodeIndex >= 0; --firstOpeningNodeIndex) {
        const child = state.children[firstOpeningNodeIndex]
        if (!child.opening) break
      }

      for (let i = firstOpeningNodeIndex + 1; i < state.children.length; ++i) {
        const child = state.children[i]
        self.closeDescendantOfPreMatchPhaseState(child, true)
      }
    }

    // Performing cleaning operation only when its opening is true
    if (shouldCloseItself && state.opening) {
      const tokenizer = self.preMatchPhaseHookMap.get(state.type)
      if (tokenizer != null && tokenizer.eatEnd != null) {
        tokenizer.eatEnd(state)
      }

      // eslint-disable-next-line no-param-reassign
      state.opening = false
    }
  }

  /**
   * register into this.*Hooks
   */
  protected registerIntoHookList = (
    hook: BlockTokenizer & BlockTokenizerHookAll,
    phase: BlockTokenizerPhase,
    hooks: BlockTokenizer[],
    lifecycleFlags: Partial<Record<BlockTokenizerPhase, false>>,
  ): void => {
    if (lifecycleFlags[phase] === false) return
    const index = hooks.findIndex(p => p.priority < hook.priority)
    if (index < 0) hooks.push(hook)
    else hooks.splice(index, 0, hook)
  }

  /**
   * register into this.*HookMap
   */
  protected registerIntoHookMap = (
    hook: BlockTokenizer & BlockTokenizerHookAll,
    phase: BlockTokenizerPhase,
    hookMap: Map<BlockDataNodeType, BlockTokenizer>,
    lifecycleFlags: Partial<Record<BlockTokenizerPhase, false>>,
  ): void => {
    if (lifecycleFlags[phase] === false) return
    for (const t of hook.uniqueTypes) {
      if (hookMap.has(t)) {
        console.warn(
          '[DefaultBlockTokenizerContext.useTokenizer] tokenizer of type `'
          + t + '` has been registered in phase `' + phase + '`. skipped')
        continue
      }
      hookMap.set(t, hook)
    }
  }
}
