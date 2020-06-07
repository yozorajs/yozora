import { produce } from 'immer'
import {
  InlineDataNodeType,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizer,
  InlineTokenizerContext,
  InlineTokenizerContextConstructorParams,
  InlineTokenizerHook,
  InlineTokenizerHookAll,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerMatchPhaseStateTree,
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  InlineTokenizerParsePhaseStateTree,
  InlineTokenizerPhase,
  InlineTokenizerPostMatchPhaseHook,
  InlineTokenizerPreMatchPhaseHook,
  InlineTokenizerPreMatchPhaseState,
  InlineTokenizerPreMatchPhaseStateTree,
  RawContent,
} from './types'
import {
  IntervalNode,
  assembleToIntervalTrees,
  compareInterval,
  removeIntersectIntervals,
} from './util/interval'


/**
 * 默认内联数据的分词器的上下文
 *
 * Default context of block tokenizer
 */
export class DefaultInlineTokenizerContext
  implements InlineTokenizerContext {
  protected readonly fallbackTokenizer?: InlineTokenizer & Partial<InlineTokenizerHookAll>

  protected readonly preMatchPhaseHooks: (
    InlineTokenizerPreMatchPhaseHook & InlineTokenizer)[]
  protected readonly preMatchPhaseHookMap: Map<
    InlineDataNodeType, InlineTokenizerPreMatchPhaseHook & InlineTokenizer>
  protected readonly matchPhaseHookMap: Map<
    InlineDataNodeType, InlineTokenizerMatchPhaseHook & InlineTokenizer>
  protected readonly transformMatchPhaseHooks: (
    InlineTokenizerPostMatchPhaseHook & InlineTokenizer)[]
  protected readonly parsePhaseHookMap: Map<
    InlineDataNodeType, InlineTokenizerParsePhaseHook & InlineTokenizer>

  public constructor(params: InlineTokenizerContextConstructorParams) {
    this.fallbackTokenizer = params.fallbackTokenizer
    this.preMatchPhaseHooks = []
    this.preMatchPhaseHookMap = new Map()
    this.matchPhaseHookMap = new Map()
    this.transformMatchPhaseHooks = []
    this.parsePhaseHookMap = new Map()

    if (this.fallbackTokenizer != null) {
      this.useTokenizer(this.fallbackTokenizer, ['pre-match'])
    }
  }

  /**
   *
   */
  public useTokenizer(
    tokenizer: InlineTokenizer & Partial<InlineTokenizerHook>,
    hookListSkippedPhase: InlineTokenizerPhase[] = [],
    hookMapSkippedPhase: InlineTokenizerPhase[] = [],
  ): this {
    const self = this
    const hook = tokenizer as InlineTokenizer & InlineTokenizerHookAll

    /**
     * register into this.*Hooks
     */
    const registerIntoHookList = (
      phase: InlineTokenizerPhase,
      hooks: InlineTokenizer[],
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
      phase: InlineTokenizerPhase,
      hookMap: Map<InlineDataNodeType, InlineTokenizer>,
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
    if (hook.eatDelimiters != null) {
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

    // parse phase
    if (hook.parse != null) {
      registerIntoHookMap('parse', self.parsePhaseHookMap)
    }

    return this
  }

  /**
   * Called in pre-match phase
   */
  public preMatch(
    rawContent: RawContent,
    _startIndex: number,
    _endIndex: number,
  ): InlineTokenizerPreMatchPhaseStateTree {
    const self = this
    const hooks = self.preMatchPhaseHooks
    const hookMap = self.preMatchPhaseHookMap
    const { codePositions } = rawContent

    /**
     *
     * @param potentialToken
     */
    const mapPotentialTokenToIntervalNode = (
      potentialToken: InlinePotentialToken,
    ): IntervalNode => {
      return {
        startIndex: potentialToken.startIndex,
        endIndex: potentialToken.endIndex,
        children: [],
        value: potentialToken,
      }
    }

    /**
     *
     * @param parent
     * @param child
     */
    const shouldAcceptEdge = (
      parent: IntervalNode<InlinePotentialToken>,
      child: IntervalNode<InlinePotentialToken>,
    ): boolean => {
      const potentialToken = parent.value
      if (potentialToken.innerRawContents == null) return false
      for (const irc of potentialToken.innerRawContents) {
        if (child.startIndex < irc.startIndex) return false
        if (child.endIndex <= irc.endIndex) return true
      }
      return false
    }

    /**
     *
     * @param intervalNode
     */
    const recursivelyProcessPotentialTokens = (
      intervalNode: IntervalNode<InlinePotentialToken>,
      nextTokenizerIndex: number,
    ): void => {
      const potentialToken = intervalNode.value
      if (potentialToken.innerRawContents == null) return

      const children: IntervalNode[] = []
      for (let i = 0, k = 0; i < potentialToken.innerRawContents.length; ++i) {
        const innerRawContent = potentialToken.innerRawContents[i]
        const intervalNodes: IntervalNode[] = []
        for (; k < intervalNode.children.length; ++k) {
          const o = intervalNode.children[k]
          if (o.startIndex >= innerRawContent.startIndex) break
        }
        for (; k < intervalNode.children.length; ++k) {
          const o = intervalNode.children[k]
          if (o.endIndex > innerRawContent.endIndex) break
          intervalNodes.push(o)
        }
        const childrenPiece = processPotentialTokens(
          innerRawContent.startIndex,
          innerRawContent.endIndex,
          nextTokenizerIndex,
          intervalNodes,
        )
        children.push(...childrenPiece)
      }
      // eslint-disable-next-line no-param-reassign
      intervalNode.children = children.sort(compareInterval)
    }

    const processPotentialTokens = (
      startIndex: number,
      endIndex: number,
      hookStartIndex: number,
      innerIntervalNodes: IntervalNode[],
    ): IntervalNode[] => {
      /**
       *
       * @param hook
       */
      let intervals = innerIntervalNodes
      const eatDelimiters = (
        hook: InlineTokenizerPreMatchPhaseHook & InlineTokenizer
      ): InlineTokenDelimiter[] => {
        const g = hook.eatDelimiters(rawContent, startIndex, endIndex)
        let result: IteratorResult<void, InlineTokenDelimiter[]> = g.next()
        if (result.done) return result.value

        let i = startIndex
        for (const iat of intervals) {
          if (i >= iat.startIndex) {
            i = Math.max(i, iat.endIndex)
            continue
          }
          result = g.next({
            startIndex: i,
            endIndex: iat.startIndex,
            precedingCodePosition: i > startIndex ? codePositions[i - 1] : null,
            followingCodePosition: iat.startIndex < endIndex ? codePositions[iat.startIndex] : null,
          })
          if (result.done) return result.value
          i = iat.endIndex
        }

        if (i < endIndex) {
          result = g.next({
            startIndex: i,
            endIndex,
            precedingCodePosition: i > startIndex ? codePositions[i - 1] : null,
            followingCodePosition: null,
          })
          if (result.done) return result.value
        }

        result = g.next(null)
        if (!result.done) {
          throw new Error(`[${ hook.name }.eatDelimiters] generator does not end after called .next(null)`)
        }
        return result.value
      }

      if (hookStartIndex < hooks.length) {
        /**
         * Collect potentialTokens by current priority tokenizer
         */
        let currentPriority: number = hooks[hookStartIndex].priority
        let currentPriorityIntervals: IntervalNode[] = []
        for (let hIndex = hookStartIndex; hIndex < hooks.length; ++hIndex) {
          const hook = hooks[hIndex]
          if (hook.priority != currentPriority) {
            currentPriority = hook.priority
            if (currentPriorityIntervals.length > 0) {
              intervals = assembleToIntervalTrees(
                removeIntersectIntervals([...intervals, ...currentPriorityIntervals]),
                (intervalNode) => recursivelyProcessPotentialTokens(intervalNode, hIndex),
                shouldAcceptEdge,
              )
            }
            currentPriorityIntervals = []
          }

          const delimiters = eatDelimiters(hook)
          const potentialTokens = hook.eatPotentialTokens(rawContent, delimiters)
          for (const potentialToken of potentialTokens) {
            currentPriorityIntervals.push(mapPotentialTokenToIntervalNode(potentialToken))
          }
        }

        if (currentPriorityIntervals.length > 0) {
          intervals = assembleToIntervalTrees(
            removeIntersectIntervals([...intervals, ...currentPriorityIntervals]),
            (intervalNode) => recursivelyProcessPotentialTokens(intervalNode, hooks.length),
            shouldAcceptEdge,
          )
        }
      }

      /**
       * There is still unknown content, use FallbackTokenizer if it exists
       * and implements the pre-match hook
       */
      if (
        self.fallbackTokenizer != null
        && self.fallbackTokenizer.eatDelimiters != null
      ) {
        const hook = self.fallbackTokenizer as InlineTokenizerPreMatchPhaseHook & InlineTokenizer
        const fallbackDelimiters = eatDelimiters(hook)
        const fallbackTokens = hook.eatPotentialTokens(rawContent, fallbackDelimiters)
        const fallbackIntervals = fallbackTokens.map(mapPotentialTokenToIntervalNode)
        if (fallbackIntervals.length > 0) {
          intervals = assembleToIntervalTrees(
            removeIntersectIntervals([...intervals, ...fallbackIntervals]),
            (intervalNode) => recursivelyProcessPotentialTokens(intervalNode, hooks.length),
            shouldAcceptEdge,
          )
        }
      }

      return intervals
    }

    const buildPreMatchPhaseStateTree = (
      intervalNode: IntervalNode<InlinePotentialToken>
    ): InlineTokenizerPreMatchPhaseState => {
      const potentialToken = intervalNode.value
      const hook = hookMap.get(potentialToken.type)!
      const innerState = intervalNode.children.map(buildPreMatchPhaseStateTree)
      const state = hook.assemblePreMatchState(rawContent, potentialToken, innerState)
      return state
    }

    const potentialTokens = processPotentialTokens(_startIndex, _endIndex, 0, [])
    const root: InlineTokenizerPreMatchPhaseStateTree = {
      type: 'root',
      startIndex: 0,
      endIndex: codePositions.length,
      children: potentialTokens.map(buildPreMatchPhaseStateTree),
    }
    return root
  }

  /**
   * Called in match phase
   */
  public match(
    rawContent: RawContent,
    preMatchPhaseStateTree: InlineTokenizerPreMatchPhaseStateTree,
  ): InlineTokenizerMatchPhaseStateTree {
    const self = this
    const { codePositions } = rawContent

    const matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree = {
      type: 'root',
      startIndex: 0,
      endIndex: codePositions.length,
      children: [],
    }

    const handle = (
      u: InlineTokenizerPreMatchPhaseState,
      v: InlineTokenizerMatchPhaseState,
    ): void => {
      if (u.children == null) return

      // Perform matchHooks
      const children = []
      for (const uo of u.children) {
        const hook = self.matchPhaseHookMap.get(uo.type)
        // cannot find matched tokenizer
        if (hook == null) {
          throw new TypeError(`[match] no tokenizer matched \`${ uo.type }\` found`)
        }
        const vo = hook.match(rawContent, uo)

        // ignored
        if (vo === false) continue

        // formatted
        children.push(vo)

        // recursive handle
        handle(uo, vo)
      }

      // eslint-disable-next-line no-param-reassign
      v.children = children
    }

    handle(preMatchPhaseStateTree as InlineTokenizerPreMatchPhaseState, matchPhaseStateTree)
    return matchPhaseStateTree
  }

  /**
   * Called in post-match phase
   */
  public postMatch(
    rawContent: RawContent,
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerMatchPhaseStateTree {
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
      o: InlineTokenizerMatchPhaseState,
    ): void => {
      if (o.children != null && o.children.length > 0) {
        for (const u of o.children) handle(u)

        // Post-order handle: Perform BlockTokenizerPostMatchPhaseHook
        let states = o.children
        for (const hook of self.transformMatchPhaseHooks) {
          states = hook.transformMatch(rawContent, states)
        }

        const flowDataNodes: InlineTokenizerMatchPhaseState[] = []
        for (const x of states) {
          flowDataNodes.push(x)
        }

        // eslint-disable-next-line no-param-reassign
        o.children = flowDataNodes
      }
    }

    // modify into immer, to make the state traceable
    const result = produce(matchPhaseStateTree, draftTree => {
      handle(draftTree)
    })
    return result
  }

  /**
   * Called in parse phase
   */
  public parse(
    rawContent: RawContent,
    matchPhaseStateTree: InlineTokenizerMatchPhaseStateTree,
  ): InlineTokenizerParsePhaseStateTree {
    const self = this

    /**
     * parse BlockTokenizerMatchPhaseState to BlockTokenizerParsePhaseState
     */
    const handle = (
      o: InlineTokenizerMatchPhaseState,
    ): InlineTokenizerParsePhaseState => {
      // Post-order handle: But first check the validity of the current node
      const hook = self.parsePhaseHookMap.get(o.type)

      // cannot find matched tokenizer
      if (hook == null) {
        throw new TypeError(`[parseFlow] no tokenizer matched \`${ o.type }\` found`)
      }

      // Post-order handle: Prioritize child nodes
      let children: InlineTokenizerParsePhaseState[] | undefined
      if (o.children != null) {
        children = []
        for (const u of o.children) {
          const v = handle(u)
          children.push(v)
        }
      }

      // Post-order handle: Perform BlockTokenizerParsePhaseHook
      const x = hook.parse(rawContent, o, children)
      return x
    }

    const children = matchPhaseStateTree.children.map(handle)
    const parsePhaseStateTree: InlineTokenizerParsePhaseStateTree = {
      type: 'root',
      children,
    }
    return parsePhaseStateTree
  }
}
