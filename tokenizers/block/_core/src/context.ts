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
        let unmatchedState: BlockTokenizerPreMatchPhaseState | null = null
        unmatchedState = parent.children[parent.children.length - 1]
        while (unmatchedState != null && unmatchedState.opening) {
          const tokenizer = self.preMatchPhaseHookMap.get(unmatchedState.type)
          if (tokenizer == null || tokenizer.eatContinuationText == null) break

          const nextIndex = tokenizer
            .eatContinuationText(codePositions, calcEatingInfo(), unmatchedState)
          if (nextIndex < 0) break

          // move forward
          moveToNext(nextIndex)

          // descending through last children down to the next open block
          if (unmatchedState.children == null || unmatchedState.children.length <= 0) {
            parent = unmatchedState
            unmatchedState = null
            break
          }

          const lastChild: BlockTokenizerPreMatchPhaseState = unmatchedState
            .children[unmatchedState.children.length - 1]
          parent = unmatchedState
          unmatchedState = lastChild
        }
      }

      /**
       * 递归关闭未匹配到状态处于 opening 的块
       * Recursively close unmatched opening blocks
       */
      let stateClosed = false
      const recursivelyCloseState = () => {
        if (stateClosed) return
        stateClosed = true
        if (parent.children == null || parent.children.length <= 0) return
        const unmatchedState = parent.children[parent.children.length - 1]
        self.recursivelyClosePreMatchState(unmatchedState)
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
          const eatingResult = tokenizer
            .eatNewMarker(codePositions, calcEatingInfo(), parent)
          if (eatingResult == null) continue

          // The marker of the new data node cannot be empty
          if (i === eatingResult.nextIndex) break

          // move forward
          moveToNext(eatingResult.nextIndex)

          /**
           * 检查新的节点是否被 parent 所接受，若不接受，则关闭 parent
           */
          while (parentTokenizer != null) {
            if (parentTokenizer.shouldAcceptChild == null) break
            if (parentTokenizer.shouldAcceptChild(parent, eatingResult.state)) break
            parent = parent.parent
            parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
            recursivelyCloseState()
          }

          /**
           * If we encounter a new block start, we close any blocks unmatched
           * in step 1 before creating the new block as a child of the last matched block
           */
          if (!newTokenMatched) {
            newTokenMatched = true
            recursivelyCloseState()
          }

          // before accept child
          if (parentTokenizer != null && parentTokenizer.beforeAcceptChild != null) {
            parentTokenizer.beforeAcceptChild(parent, eatingResult.state)
          }

          parent.children?.push(eatingResult.state)
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
          recursivelyCloseState()
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
          const nextIndex = tokenizer
            .eatLazyContinuationText(codePositions, calcEatingInfo(), lastChild)
          if (nextIndex >= 0) {
            continuationTextMatched = true
            moveToNext(nextIndex)
          }
        }
        if (!continuationTextMatched) {
          recursivelyCloseState()
        }
      }

      /**
       * There is still unknown content, close unmatched blocks and use FallbackTokenizer
       */
      if (firstNonWhiteSpaceIndex < lineEndIndex) {
        recursivelyCloseState()
        let parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
        if (
          self.fallbackTokenizer != null
          && self.fallbackTokenizer.eatNewMarker != null
          && parent.children != null
        ) {
          const eatingResult = self.fallbackTokenizer
            .eatNewMarker(codePositions, calcEatingInfo(), parent)
          if (eatingResult != null) {
            /**
             * 检查新的节点是否被 parent 所接受，若不接受，则关闭 parent
             */
            while (parentTokenizer != null) {
              if (parentTokenizer.shouldAcceptChild == null) break
              if (parentTokenizer.shouldAcceptChild(parent, eatingResult.state)) break
              parent = parent.parent
              parentTokenizer = self.preMatchPhaseHookMap.get(parent.type)
              recursivelyCloseState()
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

    self.recursivelyClosePreMatchState(root)
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

    const handle = (
      o: BlockTokenizerMatchPhaseState,
      metaDataNodes: BlockTokenizerMatchPhaseState[],
    ): void => {
      if (o.children == null || o.children.length < 0) return

      const flowDataNodes: BlockTokenizerMatchPhaseState[] = []
      const resolveAndClassify = (u: BlockTokenizerMatchPhaseState): void => {
        switch (u.classify) {
          case 'flow':
            flowDataNodes.push(u)
            break
          case 'meta':
            metaDataNodes.push(u)
            break
        }
      }

      // Perform postMatchHooks
      for (const u of o.children) {
        let x: BlockTokenizerMatchPhaseState | null = u
        for (const hook of self.transformMatchPhaseHooks) {
          const v = hook.transformMatch(u)
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
        if (x != null) resolveAndClassify(x)
      }

      // eslint-disable-next-line no-param-reassign
      o.children = flowDataNodes

      // recursive handle
      for (const u of flowDataNodes) handle(u, metaDataNodes)
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

        // recursive handle
        handle(uo, vo)
      }
    }

    handle(matchPhaseStateTree, parsePhaseStateTree)
    return parsePhaseStateTree
  }

  /**
   * 递归关闭未匹配到状态处于 opening 的块
   * Recursively close unmatched opening blocks
   * @param state
   */
  protected recursivelyClosePreMatchState(state: BlockTokenizerPreMatchPhaseState): void {
    const self = this
    if (!state.opening) return
    if (state.children != null && state.children.length > 0) {
      self.recursivelyClosePreMatchState(state.children[state.children.length - 1])
    }

    const tokenizer = self.preMatchPhaseHookMap.get(state.type)
    if (tokenizer != null && tokenizer.eatEnd != null) {
      tokenizer.eatEnd(state)
    }
    // eslint-disable-next-line no-param-reassign
    state.opening = false
  }
}
