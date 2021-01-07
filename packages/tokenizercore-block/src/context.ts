import type { YastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerContext,
  BlockTokenizerHook,
  BlockTokenizerHookAll,
  BlockTokenizerHookFlags,
  ImmutableBlockTokenizerContext,
} from './types/context'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  BlockTokenizerMatchPhaseStateTree,
  ClosedBlockTokenizerMatchPhaseState,
  ClosedBlockTokenizerMatchPhaseStateTree,
  EatingLineInfo,
  ResultOfEatAndInterruptPreviousSibling,
} from './types/lifecycle/match'
import type {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerParsePhaseStateTree,
} from './types/lifecycle/parse'
import type {
  BlockTokenizerPostMatchPhaseHook,
} from './types/lifecycle/post-match'
import type {
  BlockTokenizerPostParsePhaseHook,
} from './types/lifecycle/post-parse'
import type { YastBlockNodeMeta, YastBlockNodeType } from './types/node'
import type {
  PhrasingContentMatchPhaseState,
  PhrasingContentMatchPhaseStateData,
} from './types/phrasing-content'
import type { BlockTokenizer, FallbackBlockTokenizer } from './types/tokenizer'
import invariant from 'tiny-invariant'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import { eatOptionalWhiteSpaces } from '@yozora/tokenizercore'


/**
 * Params for constructing DefaultBlockTokenizerContext
 */
export interface DefaultBlockTokenizerContextProps {
  /**
   *
   */
  readonly fallbackTokenizer: FallbackBlockTokenizer<YastBlockNodeType, any, any>
}


/**
 * Default context of BlockTokenizer
 */
export class DefaultBlockTokenizerContext<
  M extends YastBlockNodeMeta = YastBlockNodeMeta>
  implements BlockTokenizerContext<M> {
  protected readonly getContext = this.createImmutableContext()
  protected readonly fallbackTokenizer: FallbackBlockTokenizer
  protected readonly tokenizerMap: Map<YastBlockNodeType, BlockTokenizer>
  protected readonly matchPhaseHooks: (
    BlockTokenizerMatchPhaseHook & BlockTokenizer)[]
  protected readonly matchPhaseHookMap: Map<
    YastBlockNodeType, BlockTokenizerMatchPhaseHook & BlockTokenizer>
  protected readonly postMatchPhaseHooks: (
    BlockTokenizerPostMatchPhaseHook & BlockTokenizer)[]
  protected readonly parsePhaseHookMap: Map<
    YastBlockNodeType, BlockTokenizerParsePhaseHook & BlockTokenizer>
  protected readonly postParsePhaseHooks: (
    BlockTokenizerPostParsePhaseHook & BlockTokenizer)[]

  public constructor(props: DefaultBlockTokenizerContextProps) {
    this.fallbackTokenizer = props.fallbackTokenizer
    this.tokenizerMap = new Map()
    this.matchPhaseHooks = []
    this.matchPhaseHookMap = new Map()
    this.postMatchPhaseHooks = []
    this.parsePhaseHookMap = new Map()
    this.postParsePhaseHooks = []

    // register fallback tokenizer
    this.useTokenizer(this.fallbackTokenizer, { 'match.list': false })
  }

  /**
   * Register a block tokenizer
   * @override {@link BlockTokenizerContext}
   */
  public useTokenizer(
    tokenizer: BlockTokenizer & Partial<BlockTokenizerHook>,
    hookFlags: Readonly<BlockTokenizerHookFlags> = {},
  ): this {
    // eslint-disable-next-line no-param-reassign
    tokenizer.getContext = this.getContext as () => ImmutableBlockTokenizerContext

    // register into tokenizerMap
    for (const t of tokenizer.uniqueTypes) {
      invariant(
        !this.tokenizerMap.has(t),
        `[DBTContext#useTokenizer] tokenizer for type(${ t }) has been registered!`
      )

      this.tokenizerMap.set(t, tokenizer as BlockTokenizer)
    }

    const hook = tokenizer as BlockTokenizer & BlockTokenizerHookAll

    // register into this.*Hooks
    const registerIntoHookList = (
      hooks: BlockTokenizer[],
      flag: keyof BlockTokenizerHookFlags,
    ): void => {
      if (hookFlags[flag] === false) return
      const index = hooks.findIndex(p => p.priority < hook.priority)
      if (index < 0) hooks.push(hook)
      else hooks.splice(index, 0, hook)
    }

    // register into this.*HookMap
    const registerIntoHookMap = (
      hookMap: Map<YastBlockNodeType, BlockTokenizer>,
      flag: keyof BlockTokenizerHookFlags,
    ): void => {
      if (hookFlags[flag] === false) return
      for (const t of hook.uniqueTypes) {
        hookMap.set(t, hook)
      }
    }

    // pre-match phase
    if (hook.eatOpener != null) {
      registerIntoHookList(this.matchPhaseHooks, 'match.list')
      registerIntoHookMap(this.matchPhaseHookMap, 'match.map')
    }

    // post-match phase
    if (hook.transformMatch != null) {
      registerIntoHookList(this.postMatchPhaseHooks, 'post-match.list')
    }

    // parse phase
    if (hook.parse != null) {
      registerIntoHookMap(this.parsePhaseHookMap, 'parse.map')
    }

    // post-parse
    if (hook.transformParse != null) {
      registerIntoHookList(this.postParsePhaseHooks, 'post-parse.list')
    }
    return this
  }

  /**
   * @override {@link BlockTokenizerContext}
   */
  public match(
    nodePoints: YastNodePoint[],
    startIndex: number,
    endIndex: number,
  ): ClosedBlockTokenizerMatchPhaseStateTree {
    const self = this
    const matchPhaseStateTree: BlockTokenizerMatchPhaseStateTree = {
      type: 'root',
      opening: true,
      children: [],
    }
    const root = matchPhaseStateTree as BlockTokenizerMatchPhaseState

    for (
      let lineNo = 1, i = startIndex, lineEndIndex: number;
      i < endIndex;
      lineNo += 1, i = lineEndIndex
    ) {
      // find the index of the end of current line
      for (lineEndIndex = i; lineEndIndex < endIndex; ++lineEndIndex) {
        if (nodePoints[lineEndIndex].codePoint === AsciiCodePoint.LINE_FEED) {
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
        eatOptionalWhiteSpaces(nodePoints, startIndex, endIndex)
        while (firstNonWhiteSpaceIndex < lineEndIndex) {
          const c = nodePoints[firstNonWhiteSpaceIndex]
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
      const appendChild = (nextState: BlockTokenizerMatchPhaseState): void => {
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
        let parentTokenizer = self.matchPhaseHookMap.get(parent.type)
        while (parentTokenizer != null) {
          if (parentTokenizer.shouldAcceptChild == null) break
          if (parentTokenizer.shouldAcceptChild(parent, nextState)) break
          self.closeDescendantOfPreMatchPhaseState(parent, true)

          parent = parent.parent
          parentTokenizer = self.matchPhaseHookMap.get(parent.type)
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
      let parent: BlockTokenizerMatchPhaseState = root
      if (parent.children != null && parent.children.length > 0) {
        let openedState: BlockTokenizerMatchPhaseState | undefined
        openedState = parent.children[parent.children.length - 1]
        while (openedState != null && openedState.opening) {
          const tokenizer = self.matchPhaseHookMap.get(openedState.type)
          invariant(
            tokenizer != null,
            `[DBTContext#match] no tokenizer for '${ openedState.type }' found`
          )

          let nextIndex = -1
          const eatingInfo = calcEatingInfo()

          /**
           * Try to interrupt eatContinuationText
           */
          let interrupted = false
          for (const iTokenizer of self.matchPhaseHooks) {
            if (
              iTokenizer === tokenizer ||
              !iTokenizer.couldInterruptPreviousSibling(openedState.type, tokenizer.priority)
            ) continue

            let eatAndInterruptResult: ResultOfEatAndInterruptPreviousSibling
            if (iTokenizer.eatAndInterruptPreviousSibling != null) {
              // try `eatAndInterruptPreviousSibling` first
              eatAndInterruptResult = iTokenizer.eatAndInterruptPreviousSibling(
                nodePoints, eatingInfo, parent, openedState)
            } else {
              // `eatOpener` as a fallback option
              const result = iTokenizer.eatOpener(nodePoints, eatingInfo, parent)
              eatAndInterruptResult = result == null
                ? null
                : { ...result, shouldRemovePreviousSibling: false }
            }
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
            const result = tokenizer.eatContinuationText(nodePoints, eatingInfo, openedState)

            if (result != null) {
              const { state: nextState } = result
              nextIndex = result.nextIndex
              parent.children!.pop()

              if (result.finished) {
                openedState = parent.children![parent.children!.length - 1]

                /**
                 * If eatContinuationResult.state is not null, push it back
                 * of parent.children
                 */
                if (nextState != null) {
                  appendChild(nextState)
                }

                self.closeDescendantOfPreMatchPhaseState(parent, false)
                if (result.lines.length > 0) {
                  const fallbackState = self.fallbackTokenizer.buildPhrasingContentMatchPhaseState(
                    true, parent, result.lines)
                  appendChild(fallbackState)
                }

                // Re-parsing this line
                openedState = parent
                parent = parent.parent
              } else {
                invariant(
                  nextState != null,
                  '[DefaultBlockTokenizerContext.match] `state` shouldn\'t be null if `finished` is not true'
                )

                // If saturated, close current state
                if (nextState.saturated) {
                  self.closeDescendantOfPreMatchPhaseState(nextState, true)
                }

                appendChild(nextState)
                openedState = nextState
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

          const lastChild: BlockTokenizerMatchPhaseState | undefined =
            openedState.children[openedState.children.length - 1]
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
        for (const tokenizer of self.matchPhaseHooks) {
          // if (tokenizer === openedStateTokenizer) continue

          const eatingInfo = calcEatingInfo()
          const eatingResult = tokenizer.eatOpener(nodePoints, eatingInfo, parent)
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
      let lastChild: BlockTokenizerMatchPhaseState = parent
      while (lastChild.children != null && lastChild.children.length > 0) {
        lastChild = lastChild.children[lastChild.children.length - 1]
      }
      if (lastChild.opening) {
        let continuationTextMatched = false
        const tokenizer = self.matchPhaseHookMap.get(lastChild.type)
        if (tokenizer != null && tokenizer.eatLazyContinuationText != null) {
          const eatingInfo = calcEatingInfo()
          const lazyContinuationTextResult = tokenizer
            .eatLazyContinuationText(nodePoints, eatingInfo, lastChild)
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
            .eatOpener(nodePoints, eatingInfo, parent)
          if (eatingResult != null && eatingResult.nextIndex > i) {
            moveToNext(eatingResult.nextIndex)
            appendChild(eatingResult.state)
          }
        }
      }
    }

    self.closeDescendantOfPreMatchPhaseState(root, true)
    return matchPhaseStateTree
  }

  /**
   * @override {@link BlockTokenizerContext}
   */
  public postMatch(
    closedMatchPhaseStateTree: ClosedBlockTokenizerMatchPhaseStateTree,
  ): ClosedBlockTokenizerMatchPhaseStateTree {
    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (
      o: ClosedBlockTokenizerMatchPhaseState,
    ): void => {
      if (o.children != null && o.children.length > 0) {
        for (const u of o.children) handle(u)

        // Post-order handle: Perform BlockTokenizerPostMatchPhaseHook
        let states = o.children
        for (const hook of this.postMatchPhaseHooks) {
          states = hook.transformMatch(states)
        }

        // eslint-disable-next-line no-param-reassign
        o.children = states
      }
    }

    handle(closedMatchPhaseStateTree)
    return closedMatchPhaseStateTree
  }

  /**
   * @override {@link BlockTokenizerContext}
   */
  public parse(
    closedMatchPhaseStateTree: ClosedBlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerParsePhaseStateTree<M> {
    const metaDataNodes: BlockTokenizerParsePhaseState[] = []

    /**
     * Post-order process.
     *
     * Parse BlockTokenizerMatchPhaseState list to BlockTokenizerParsePhaseState list,
     * and categorize YastNodes.
     *
     * @param nodes
     */
    const handleFlowNodes = (
      nodes: ClosedBlockTokenizerMatchPhaseState[],
    ): BlockTokenizerParsePhaseState[] => {
      const flowDataNodes: BlockTokenizerParsePhaseState[] = []
      for (const o of nodes) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.parsePhaseHookMap.get(o.type)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[DBTContext#parse] no tokenizer for '${ o.type }' found`
        )

        // Post-order handle: Prioritize child nodes
        const children: BlockTokenizerParsePhaseState[] | undefined = o.children != null
          ? handleFlowNodes(o.children)
          : undefined

        // Post-order handle: Perform BlockTokenizerParsePhaseHook
        const resultOfParse = hook.parse(o, children)
        if (resultOfParse == null) continue

        switch (resultOfParse.classification) {
          case 'flow':
            flowDataNodes.push(resultOfParse.state)
            break
          case 'meta':
            metaDataNodes.push(resultOfParse.state)
            break
        }
      }
      return flowDataNodes
    }

    // parse flow
    const children: BlockTokenizerParsePhaseState[] =
      handleFlowNodes(closedMatchPhaseStateTree.children)

    // parse meta
    const meta: YastBlockNodeMeta = {}
    const rawMeta: Record<YastBlockNodeType, BlockTokenizerParsePhaseState[]> = {}
    for (const o of metaDataNodes) {
      const metaData = rawMeta[o.type] || []
      metaData.push(o)
      rawMeta[o.type] = metaData
    }
    for (const t of Object.keys(rawMeta)) {
      const hook = this.parsePhaseHookMap.get(t)
      invariant(
        hook != null && hook.parseMeta != null,
        `[DBTContext#parse] no tokenizer.parseMeta for '${ t }' found`
      )

      const states = rawMeta[t]
      const vo = hook.parseMeta(states)
      meta[t] = vo
    }

    const parsePhaseStateTree: BlockTokenizerParsePhaseStateTree<M> = {
      type: 'root',
      meta: meta as M,
      children,
    }
    return parsePhaseStateTree
  }

  /**
   * @override {@link BlockTokenizerContext}
   */
  public postParse(
    parsePhaseStateTree: BlockTokenizerParsePhaseStateTree<M>
  ): BlockTokenizerParsePhaseStateTree<M> {
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
        for (const hook of this.postParsePhaseHooks) {
          states = hook.transformParse(parsePhaseStateTree.meta, states)
        }

        // eslint-disable-next-line no-param-reassign
        o.children = states
      }
    }

    handle(parsePhaseStateTree as BlockTokenizerParsePhaseState, [])
    return parsePhaseStateTree
  }

  /**
   * @override {@link BlockTokenizerContext}
   */
  public extractPhrasingContentMS(
    matchPhaseState: BlockTokenizerMatchPhaseState,
  ): PhrasingContentMatchPhaseState | null {
    const tokenizer = this.matchPhaseHookMap.get(matchPhaseState.type)

    // no tokenizer for `matchPhaseState.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentMS == null) return null
    return tokenizer.extractPhrasingContentMS(matchPhaseState)
  }

  /**
   * @override {@link BlockTokenizerContext}
   */
  public extractPhrasingContentCMS(
    matchPhaseStateData: BlockTokenizerMatchPhaseStateData,
  ): PhrasingContentMatchPhaseStateData | null {
    const tokenizer = this.matchPhaseHookMap.get(matchPhaseStateData.type)

    // no tokenizer for `matchPhaseState.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentCMS == null) return null
    return tokenizer.extractPhrasingContentCMS(matchPhaseStateData)
  }

  /**
   * @override {@link BlockTokenizerContext}
   */
  public buildCMSFromPhrasingContentData(
    originalClosedMatchState: ClosedBlockTokenizerMatchPhaseState,
    phrasingContentStateData: PhrasingContentMatchPhaseStateData,
  ): ClosedBlockTokenizerMatchPhaseState | null {
    const originalType = originalClosedMatchState.type
    const tokenizer = this.matchPhaseHookMap.get(originalType)

    // If the phrasingContentStateData has been extracted (by extractPhrasingContentCMS),
    // then the buildCMSFromPhrasingContentData must also be defined
    invariant(
      tokenizer != null,
      `[DBTContext#buildCMSFromPhrasingContentData] no tokenizer for '${ originalType }' found`
    )

    if (tokenizer.buildCMSFromPhrasingContentData == null) return null
    return tokenizer.buildCMSFromPhrasingContentData(
      originalClosedMatchState, phrasingContentStateData)
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
    state: BlockTokenizerMatchPhaseState,
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
      const tokenizer = self.matchPhaseHookMap.get(state.type)
      if (tokenizer != null && tokenizer.beforeClose != null) {
        tokenizer.beforeClose(state)
      }

      // eslint-disable-next-line no-param-reassign
      state.opening = false
    }
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => ImmutableBlockTokenizerContext<M>) {
    const context: ImmutableBlockTokenizerContext<M> = {
      match: this.match.bind(this),
      postMatch: this.postMatch.bind(this),
      parse: this.parse.bind(this),
      postParse: this.postParse.bind(this),
      extractPhrasingContentMS:
        this.extractPhrasingContentMS.bind(this),
      extractPhrasingContentCMS:
        this.extractPhrasingContentCMS.bind(this),
      buildCMSFromPhrasingContentData:
        this.buildCMSFromPhrasingContentData.bind(this),
    }

    // Return a new shallow copy each time to prevent accidental modification
    return () => ({ ...context })
  }
}
