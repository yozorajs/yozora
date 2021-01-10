import type { EnhancedYastNodePoint } from '@yozora/tokenizercore'
import type {
  BlockTokenizerContext,
  BlockTokenizerContextMatchPhaseState,
  BlockTokenizerContextMatchPhaseStateTree,
  BlockTokenizerContextParsePhaseState,
  BlockTokenizerContextParsePhaseStateTree,
  BlockTokenizerContextPostMatchPhaseState,
  BlockTokenizerContextPostMatchPhaseStateTree,
  BlockTokenizerHook,
  BlockTokenizerHookAll,
  BlockTokenizerHookFlags,
  ImmutableBlockTokenizerContext,
} from './types/context'
import type { YastBlockNodeMeta, YastBlockNodeType } from './types/node'
import invariant from 'tiny-invariant'
import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import { calcYastNodePoint } from '@yozora/tokenizercore'
import {
  BlockTokenizer,
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostParsePhaseHook,
  EatingLineInfo,
  FallbackBlockTokenizer,
  PhrasingContentMatchPhaseState,
  PhrasingContentType,
  ResultOfEatAndInterruptPreviousSibling,
  ResultOfEatOpener,
} from './types/tokenizer'


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
   * @override
   * @see BlockTokenizerContext
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
   * @override
   * @see BlockTokenizerContext
   */
  public match(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    startIndex: number,
    endIndex: number,
  ): BlockTokenizerContextMatchPhaseStateTree {
    const tree: BlockTokenizerContextMatchPhaseStateTree = {
      opening: true,
      data: {
        type: 'root',
      },
      position: {
        start: calcYastNodePoint(nodePoints, 0),
        end: calcYastNodePoint(nodePoints, nodePoints.length),
      },
      children: [],
    }

    const root = tree as BlockTokenizerContextMatchPhaseState
    let lastChild: BlockTokenizerContextMatchPhaseState = root

    for (
      let lineNo = 1, i = startIndex, firstNonWhiteSpaceIndex = startIndex, endOfLine: number;
      i < endIndex;
      lineNo += 1, i = endOfLine
    ) {
      // find the index of the end of current line
      for (endOfLine = i; endOfLine < endIndex; ++endOfLine) {
        if (nodePoints[endOfLine].codePoint === AsciiCodePoint.LINE_FEED) {
          endOfLine += 1
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
      const calcEatingInfo = (): EatingLineInfo => {
        return {
          lineNo,
          startIndex: i,
          endIndex: endOfLine,
          firstNonWhiteSpaceIndex,
          isBlankLine: firstNonWhiteSpaceIndex >= endOfLine,
        }
      }

      /**
       * Move *i* forward to the next starting match position
       * @param nextIndex next matching position
       */
      const moveForward = (nextIndex: number): void => {
        invariant(i <= nextIndex, `[DBTContext#match$moveToNext] only move forward is allowed. i(${ i }), nextIndex(${ nextIndex })`)

        i = nextIndex
        if (firstNonWhiteSpaceIndex < nextIndex) {
          firstNonWhiteSpaceIndex = nextIndex
        }
        while (firstNonWhiteSpaceIndex < endOfLine) {
          const p = nodePoints[firstNonWhiteSpaceIndex]
          if (!isWhiteSpaceCharacter(p.codePoint)) break
          firstNonWhiteSpaceIndex += 1
        }
      }

      // Trigger initialize the firstNonWhiteSpaceIndex.
      moveForward(i)

      /**
       * Find a latest ancient which accept the *nextState*, and append the
       * *nextState* into its child node list.
       *
       * Check if the new node is accepted by parent, if not, close parent
       * and traverse the ancestor chain until it finds an ancestor node
       * that receives this new node or be fallback to the root node.
       *
       * @param nextState
       * @param saturated
       * @returns the next opening state
       */
      let parent: BlockTokenizerContextMatchPhaseState = root
      const appendNode = (
        nextState: BlockTokenizerContextMatchPhaseState,
        saturated?: boolean,
      ): void => {
        // eslint-disable-next-line no-param-reassign
        for (; parent.data.type !== 'root'; parent = parent.parent) {
          const tokenizer = this.matchPhaseHookMap.get(parent.data.type)
          invariant(
            tokenizer != null,
            `[DBTContext#match$appendChild] no tokenizer for '${ parent.data.type }' found`
          )

          if (
            tokenizer.shouldAcceptChild == null ||
            tokenizer.shouldAcceptChild(parent.data, nextState.data)
          ) {
            /**
             * If we encounter a new block node, we close any blocks unmatched
             * in step 1 before creating the new block as a child of the last
             * matched block.
             */
            this.closeDescendantOfMatchPhaseState(parent, false)

            // Before accept child
            if (tokenizer.beforeAcceptChild != null) {
              tokenizer.beforeAcceptChild(parent.data, nextState.data)
            }
            break
          }
        }

        // eslint-disable-next-line no-param-reassign
        nextState.parent = parent
        parent.children.push(nextState)
        lastChild = nextState

        if (saturated) {
          this.closeDescendantOfMatchPhaseState(nextState, true)
        } else {
          parent = nextState
        }
      }

      /**
       * Remove the last child from *parent*.
       */
      const removeLastChildOfParent = (): void => {
        parent.children.pop()

        // Update the lastChild if it is removed in this operation.
        if (lastChild.parent === parent) {
          lastChild = parent.children.length > 0
            ? parent.children[parent.children.length - 1]
            : parent
        }
      }

      /**
       * Step 1: First we iterate through the open blocks, starting with the
       *         root document, and descending through last children down to
       *         the last open block. Each block imposes a condition that the
       *         line must satisfy if the block is to remain open.
       * @see https://github.github.com/gfm/#phase-1-block-structure
       */
      while (i < endOfLine && parent.children.length > 0) {
        const openingState = parent.children[parent.children.length - 1]
        if (openingState == null || !openingState.opening) break

        const tokenizer = this.matchPhaseHookMap.get(openingState.data.type)
        invariant(
          tokenizer != null,
          `[DBTContext#match] no tokenizer for '${ openingState.data.type }' found`
        )

        const eatingInfo = calcEatingInfo()

        // Try to interrupt eatContinuationText
        {
          let result: ResultOfEatAndInterruptPreviousSibling<YastBlockNodeType> = null
          for (const iTokenizer of this.matchPhaseHooks) {
            if (
              iTokenizer === tokenizer ||
              !iTokenizer.couldInterruptPreviousSibling(openingState.data.type, tokenizer.priority)
            ) continue

            if (iTokenizer.eatAndInterruptPreviousSibling != null) {
              // try `eatAndInterruptPreviousSibling` first
              result = iTokenizer.eatAndInterruptPreviousSibling(
                nodePoints, eatingInfo, openingState.data, parent.data)
            } else {
              // `eatOpener` as a fallback option
              result = iTokenizer.eatOpener(nodePoints, eatingInfo, parent.data)
            }
            if (result != null) break
          }

          // Successfully interrupt the previous node.
          if (result != null) {
            /**
             * Successful interrupt
             *  - Remove/Close previous sibling state
             *  - Continue processing with the new state
             */
            if (result.shouldRemovePreviousSibling) {
              removeLastChildOfParent()
            }

            // Move forward
            moveForward(result.nextIndex)

            const nextState: BlockTokenizerContextMatchPhaseState = {
              parent,
              opening: true,
              data: result.state,
              position: {
                start: calcYastNodePoint(nodePoints, eatingInfo.startIndex),
                end: calcYastNodePoint(nodePoints, result.nextIndex),
              },
              children: [],
            }
            appendNode(nextState, result.saturated)
            continue
          }
        }

        // If not be interrupted, try to match the continuation text.
        if (tokenizer.eatContinuationText != null) {
          const result = tokenizer.eatContinuationText(
            nodePoints, eatingInfo, openingState.data, parent.data)
          if (result == null) break

          // Match failed, and will trigger re-parsing in this line.
          if (result.failed) {
            removeLastChildOfParent()
            if (result.lines.length > 0) {
              const phrasingContentStateData: PhrasingContentMatchPhaseState = {
                type: PhrasingContentType,
                lines: result.lines,
              }
              const nextState: BlockTokenizerContextMatchPhaseState = {
                parent,
                opening: true,
                data: phrasingContentStateData,
                position: openingState.position,
                children: [],
              }
              appendNode(nextState, result.saturated)
              parent = nextState.parent
            }
          } else {
            // Move forward.
            moveForward(result.nextIndex)

            // If saturated, close current state.
            if (result.saturated) {
              this.closeDescendantOfMatchPhaseState(openingState, true)
              break
            }

            // Otherwise, descend down the tree to the next unclosed node.
            parent = openingState
          }
          continue
        }

        // Neither interrupted nor matched.
        break
      }

      /**
       * Step 2: Next, after consuming the continuation markers for existing
       *         blocks, we look for new block starts (e.g. > for a block quote)
       */
      while (i < endOfLine) {
        let result: ResultOfEatOpener = null
        const eatingInfo = calcEatingInfo()
        for (const tokenizer of this.matchPhaseHooks) {
          result = tokenizer.eatOpener(nodePoints, eatingInfo, parent.data)
          if (result != null) break
        }

        // No further new opener matched.
        if (result == null) break

        // The marker of the new data node cannot be empty
        invariant(
          result.nextIndex > i,
          `[DBTContext#match] The marker of the new data node cannot be empty. type(${ result.state.type })`
        )

        // Move forward
        moveForward(result.nextIndex)

        const nextState: BlockTokenizerContextMatchPhaseState = {
          parent,
          opening: true,
          data: result.state,
          position: {
            start: calcYastNodePoint(nodePoints, eatingInfo.startIndex),
            end: calcYastNodePoint(nodePoints, result.nextIndex),
          },
          children: [],
        }
        appendNode(nextState, result.saturated)
      }

      /**
       * There is no remaining content in this bank, end the match prematurely.
       */
      if (i >= endOfLine) continue

      /**
       * Step 3: Finally, we look at the remainder of the line (after block
       *         markers like >, list markers, and indentation have been consumed).
       *         This is text that can be incorporated into the last open block
       *         (a paragraph, code block, heading, or raw HTML).
       */
      if (lastChild.opening) {
        let hasLazyContinuationTextMatched = false
        const tokenizer = this.matchPhaseHookMap.get(lastChild.data.type)
        if (tokenizer != null && tokenizer.eatLazyContinuationText != null) {
          const eatingInfo = calcEatingInfo()
          const result = tokenizer.eatLazyContinuationText(
            nodePoints, eatingInfo, lastChild.data, lastChild.parent.data)
          if (result != null) {
            hasLazyContinuationTextMatched = true
            moveForward(result.nextIndex)
            if (result.saturated) {
              this.closeDescendantOfMatchPhaseState(lastChild, true)
            }
          }
        }

        // No lazy continuation text matched, then closed the last opening state
        if (!hasLazyContinuationTextMatched) {
          this.closeDescendantOfMatchPhaseState(parent, false)
        }
      }

      /**
       * There is still unknown content, close unmatched blocks and
       * use FallbackTokenizer to consuming the remaining content of the line.
       */
      if (i < endOfLine) {
        this.closeDescendantOfMatchPhaseState(parent, false)
        const eatingInfo = calcEatingInfo()
        const result = this.fallbackTokenizer.eatOpener(
          nodePoints, eatingInfo, parent.data)

        invariant(
          result != null || firstNonWhiteSpaceIndex >= endOfLine,
          '[DBTContext#match] fallback.eatOpener should consuming all the non-whitespace remaining contents'
        )

        if (result != null) {
          // Move forward.
          moveForward(result.nextIndex)

          const nextState: BlockTokenizerContextMatchPhaseState = {
            parent,
            opening: true,
            data: result.state,
            position: {
              start: calcYastNodePoint(nodePoints, eatingInfo.startIndex),
              end: calcYastNodePoint(nodePoints, result.nextIndex),
            },
            children: [],
          }
          appendNode(nextState, result.saturated)
        }
      }
    }

    this.closeDescendantOfMatchPhaseState(root, true)
    return tree
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public postMatch(
    closedMatchPhaseStateTree: BlockTokenizerContextMatchPhaseStateTree,
  ): BlockTokenizerContextPostMatchPhaseStateTree {
    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (
      o: BlockTokenizerContextMatchPhaseState,
    ): BlockTokenizerContextPostMatchPhaseState => {
      const result: BlockTokenizerContextPostMatchPhaseState = {
        ...o.data,
        position: o.position,
      }

      if (o.children != null && o.children.length > 0) {
        // Post-order handle: Perform BlockTokenizerPostMatchPhaseHook
        let states = o.children.map(handle)
        for (const hook of this.postMatchPhaseHooks) {
          states = hook.transformMatch(states)
        }
        result.children = states
      }

      return result
    }

    const tree: BlockTokenizerContextPostMatchPhaseStateTree = {
      type: 'root',
      children: closedMatchPhaseStateTree.children.map(handle),
    }
    return tree
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public parse(
    closedMatchPhaseStateTree: BlockTokenizerContextPostMatchPhaseStateTree,
  ): BlockTokenizerContextParsePhaseStateTree<M> {
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
      nodes: BlockTokenizerContextPostMatchPhaseState[],
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
    const children: BlockTokenizerContextParsePhaseState[] =
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

    const parsePhaseStateTree: BlockTokenizerContextParsePhaseStateTree<M> = {
      type: 'root',
      meta: meta as M,
      children,
    }
    return parsePhaseStateTree
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public postParse(
    parsePhaseStateTree: BlockTokenizerContextParsePhaseStateTree<M>
  ): BlockTokenizerContextParsePhaseStateTree<M> {
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

    handle(parsePhaseStateTree as unknown as BlockTokenizerParsePhaseState, [])
    return parsePhaseStateTree
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public extractPhrasingContentMatchPhaseState(
    state: BlockTokenizerMatchPhaseState,
  ): PhrasingContentMatchPhaseState | null {
    const tokenizer = this.matchPhaseHookMap.get(state.type)

    // no tokenizer for `matchPhaseState.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentMatchPhaseState == null) return null
    return tokenizer.extractPhrasingContentMatchPhaseState(state)
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public buildMatchPhaseState(
    originalState: BlockTokenizerMatchPhaseState,
    phrasingContentState: PhrasingContentMatchPhaseState,
  ): BlockTokenizerMatchPhaseState | null {
    const originalType = originalState.type
    const tokenizer = this.matchPhaseHookMap.get(originalType)

    // If the phrasingContentStateData has been extracted (by extractPhrasingContentCMS),
    // then the buildCMSFromPhrasingContentData must also be defined
    invariant(
      tokenizer != null,
      `[DBTContext#buildCMSFromPhrasingContentData] no tokenizer for '${ originalType }' found`
    )

    if (tokenizer.buildFromPhrasingContentMatchPhaseState == null) return null
    return tokenizer.buildFromPhrasingContentMatchPhaseState(
      originalState, phrasingContentState)
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public buildPostMatchPhaseState(
    originalState: BlockTokenizerMatchPhaseState,
    phrasingContentState: PhrasingContentMatchPhaseState,
  ): BlockTokenizerMatchPhaseState | null {
    return null
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
  protected closeDescendantOfMatchPhaseState(
    state: BlockTokenizerContextMatchPhaseState,
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
        self.closeDescendantOfMatchPhaseState(child, true)
      }
    }

    // Performing cleaning operation only when its opening is true
    if (shouldCloseItself && state.opening) {
      const tokenizer = self.matchPhaseHookMap.get(state.data.type)
      if (tokenizer != null && tokenizer.beforeClose != null) {
        tokenizer.beforeClose(state.data)
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
      extractPhrasingContentMatchPhaseState:
        this.extractPhrasingContentMatchPhaseState.bind(this),
      buildMatchPhaseState:
        this.buildMatchPhaseState.bind(this),
      buildPostMatchPhaseState:
        this.buildPostMatchPhaseState.bind(this),
    }

    // Return a new shallow copy each time to prevent accidental modification
    return () => ({ ...context })
  }
}
