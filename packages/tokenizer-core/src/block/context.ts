import { AsciiCodePoint, isWhiteSpaceCharacter } from '@yozora/character'
import { produce } from 'immer'
import { DataNodeTokenPointDetail } from '../_types/token'
import {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateTree,
} from './lifecycle/match'
import {
  BlockTokenizerParseFlowPhaseHook,
  BlockTokenizerParseFlowPhaseState,
  BlockTokenizerParseFlowPhaseStateTree,
} from './lifecycle/parse-flow'
import {
  BlockTokenizerParseMetaPhaseHook,
  BlockTokenizerParseMetaPhaseStateTree,
} from './lifecycle/parse-meta'
import { BlockTokenizerPostMatchPhaseHook } from './lifecycle/post-match'
import {
  BlockDataNodeEatingInfo,
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
  BlockTokenizerPreMatchPhaseStateTree,
} from './lifecycle/pre-match'
import {
  BlockDataNodeTokenizer,
  BlockDataNodeTokenizerContext,
  BlockDataNodeType,
} from './types'


export type BlockTokenizerHook =
  & BlockTokenizerPreMatchPhaseHook
  & BlockTokenizerMatchPhaseHook
  & BlockTokenizerPostMatchPhaseHook
  & BlockTokenizerParseMetaPhaseHook
  & BlockTokenizerParseFlowPhaseHook


export abstract class BaseBlockDataNodeTokenizerContext implements BlockDataNodeTokenizerContext {
  protected readonly fallbackTokenizer?: BlockDataNodeTokenizer & Partial<BlockTokenizerHook>
  protected readonly preMatchPhaseHooks: (
    BlockTokenizerPreMatchPhaseHook & BlockDataNodeTokenizer)[]
  protected readonly preMatchPhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerPreMatchPhaseHook & BlockDataNodeTokenizer>
  protected readonly matchPhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerMatchPhaseHook & BlockDataNodeTokenizer>
  protected readonly transformMatchPhaseHooks: (
    BlockTokenizerPostMatchPhaseHook & BlockDataNodeTokenizer)[]
  protected readonly parseMetaPhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerParseMetaPhaseHook & BlockDataNodeTokenizer>
  protected readonly parseFlowPhaseHookMap: Map<
    BlockDataNodeType, BlockTokenizerParseFlowPhaseHook & BlockDataNodeTokenizer>

  public constructor(fallbackTokenizer?: BlockDataNodeTokenizer & Partial<BlockTokenizerHook>) {
    this.fallbackTokenizer = fallbackTokenizer as BlockDataNodeTokenizer & Partial<BlockTokenizerHook>
    this.preMatchPhaseHooks = []
    this.preMatchPhaseHookMap = new Map()
    this.matchPhaseHookMap = new Map()
    this.transformMatchPhaseHooks = []
    this.parseMetaPhaseHookMap = new Map()
    this.parseFlowPhaseHookMap = new Map()
  }

  /**
   *
   */
  public register(tokenizer: BlockDataNodeTokenizer & Partial<BlockTokenizerHook>): void {
    const stableOrderedPush = (
      hooks: BlockDataNodeTokenizer[],
      hook: BlockDataNodeTokenizer,
    ) => {
      let i = 0
      for (; i < hooks.length; ++i) {
        if (hooks[i].priority < hook.priority) break
      }
      hooks.splice(i, 0, hook)
    }

    const self = this
    const hook = tokenizer as BlockDataNodeTokenizer & BlockTokenizerHook

    // pre-match
    if (hook.eatNewMarker != null) {
      stableOrderedPush(self.preMatchPhaseHooks, hook)
      for (const t of tokenizer.uniqueTypes) {
        self.preMatchPhaseHookMap.set(t, hook)
      }
    }

    // match
    if (hook.match != null) {
      for (const t of tokenizer.uniqueTypes) {
        self.matchPhaseHookMap.set(t, hook)
      }
    }

    // post-match
    if (hook.transformMatch != null) {
      stableOrderedPush(self.transformMatchPhaseHooks, hook)
    }

    // parse-meta
    if (hook.parseMeta != null) {
      for (const t of tokenizer.uniqueTypes) {
        self.parseMetaPhaseHookMap.set(t, hook)
      }
    }

    // parse-flow
    if (hook.parseFlow != null) {
      for (const t of tokenizer.uniqueTypes) {
        self.parseFlowPhaseHookMap.set(t, hook)
      }
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
    const result: BlockTokenizerPreMatchPhaseStateTree = {
      type: 'root',
      opening: true,
      children: [],
    }

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
      const calcEatingInfo = (): BlockDataNodeEatingInfo => {
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
      let parent = result as BlockTokenizerPreMatchPhaseState
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
        self.recursivelyCloseState(unmatchedState)
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

    return result
  }

  /**
   * Called in match phase
   */
  public match(
    tree: BlockTokenizerPreMatchPhaseStateTree,
  ): BlockTokenizerMatchPhaseStateTree {
    const self = this
    const result: BlockTokenizerMatchPhaseStateTree = {
      type: 'root',
      classify: 'flow',
      children: [],
      meta: [],
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

    handle(tree as BlockTokenizerPreMatchPhaseState, result)
    return result
  }

  /**
   * Called in post-match phase
   */
  public postMatch(
    tree: BlockTokenizerMatchPhaseStateTree,
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
    const result = produce(tree, draftTree => {
      const metaDataNodes: BlockTokenizerMatchPhaseState[] = []
      handle(draftTree, metaDataNodes)

      // eslint-disable-next-line no-param-reassign
      draftTree.meta = metaDataNodes
    })
    return result
  }

  /**
   * Called in parse-meta phase
   */
  public parseMeta(
    tree: BlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerParseMetaPhaseStateTree {
    const self = this
    const result: BlockTokenizerParseMetaPhaseStateTree = {
      type: 'root',
      meta: {},
    }

    const rawMeta = {}
    for (const o of tree.meta) {
      const metaData = result.meta[o.type] || []
      metaData.push(o)
      rawMeta[o.type] = metaData
    }

    // Perform parseMetaHooks
    for (const t of Object.keys(rawMeta)) {
      const hook = self.parseMetaPhaseHookMap.get(t)
      // cannot find matched tokenizer
      if (hook == null) {
        throw new TypeError(`[parseMeta] no tokenizer matched \`${ t }\` found`)
      }

      const states = rawMeta[t]
      const vo = hook.parseMeta(states)
      result.meta[t] = vo
    }
    return result
  }

  /**
   * Called in parse-flow phase
   */
  public parseFlow(
    tree: BlockTokenizerMatchPhaseStateTree,
  ): BlockTokenizerParseFlowPhaseStateTree {
    const self = this
    const result: BlockTokenizerParseFlowPhaseStateTree = {
      type: 'root',
      children: [],
    }

    const handle = (
      u: BlockTokenizerMatchPhaseState,
      v: BlockTokenizerParseFlowPhaseState,
    ): void => {
      if (u.children == null) return
      // eslint-disable-next-line no-param-reassign
      v.children = []

      // Perform parseFlowHooks
      for (const uo of u.children) {
        const hook = self.parseFlowPhaseHookMap.get(uo.type)
        // cannot find matched tokenizer
        if (hook == null) {
          throw new TypeError(`[parseFlow] no tokenizer matched \`${ uo.type }\` found`)
        }
        const vo = hook.parseFlow(uo)
        v.children.push(vo)

        // recursive handle
        handle(uo, vo)
      }
    }

    handle(tree, result)
    return result
  }

  /**
   * 递归关闭未匹配到状态处于 opening 的块
   * Recursively close unmatched opening blocks
   * @param state
   */
  protected recursivelyCloseState(state: BlockTokenizerPreMatchPhaseState): void {
    const self = this
    if (!state.opening) return
    if (state.children != null && state.children.length > 0) {
      self.recursivelyCloseState(state.children[state.children.length - 1])
    }

    const tokenizer = self.preMatchPhaseHookMap.get(state.type)
    if (tokenizer != null && tokenizer.eatEnd != null) {
      tokenizer.eatEnd(state)
    }
    // eslint-disable-next-line no-param-reassign
    state.opening = false
  }
}
