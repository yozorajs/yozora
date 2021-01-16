import type { YastMeta } from '@yozora/tokenizercore'
import type {
  ImmutableInlineTokenizerContext,
  InlineTokenizerContext,
  InlineTokenizerHook,
  InlineTokenizerHookAll,
  InlineTokenizerHookFlags,
} from './types/context'
import type { RawContent, YastInlineNodeType } from './types/node'
import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerMatchPhaseStateTree,
} from './types/tokenizer/lifecycle/match'
import type {
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
  InlineTokenizerParsePhaseStateTree,
} from './types/tokenizer/lifecycle/parse'
import type {
  InlineTokenizerPostMatchPhaseHook,
} from './types/tokenizer/lifecycle/post-match'
import type {
  FallbackInlineTokenizer,
  InlineTokenizer,
} from './types/tokenizer/tokenizer'
import type { IntervalNode } from './util/interval'
import invariant from 'tiny-invariant'
import {
  assembleToIntervalTrees,
  compareInterval,
  removeIntersectIntervals,
} from './util/interval'


/**
 * Params for constructing DefaultInlineTokenizerContext
 */
export interface DefaultInlineTokenizerContextProps {
  /**
   *
   */
  readonly fallbackTokenizer?: FallbackInlineTokenizer | null
}


/**
 * Default context of InlineTokenizer
 */
export class DefaultInlineTokenizerContext<M extends YastMeta = YastMeta>
  implements InlineTokenizerContext<M> {
  protected readonly getContext = this.createImmutableContext()
  protected readonly fallbackTokenizer: FallbackInlineTokenizer | null
  protected readonly tokenizerMap: Map<YastInlineNodeType, InlineTokenizer>
  protected readonly matchPhaseHooks:
    (InlineTokenizer & InlineTokenizerMatchPhaseHook)[]
  protected readonly matchPhaseHookMap:
    Map<YastInlineNodeType, (InlineTokenizer & InlineTokenizerMatchPhaseHook)>
  protected readonly postMatchPhaseHooks:
    (InlineTokenizer & InlineTokenizerPostMatchPhaseHook)[]
  protected readonly parsePhaseHookMap:
    Map<YastInlineNodeType, (InlineTokenizer & InlineTokenizerParsePhaseHook)>

  public constructor(props: DefaultInlineTokenizerContextProps) {
    this.fallbackTokenizer = props.fallbackTokenizer == null ? null : props.fallbackTokenizer

    this.tokenizerMap = new Map()
    this.matchPhaseHooks = []
    this.matchPhaseHookMap = new Map()
    this.postMatchPhaseHooks = []
    this.parsePhaseHookMap = new Map()

    if (this.fallbackTokenizer != null) {
      const fallbackTokenizer = this.fallbackTokenizer as InlineTokenizer & InlineTokenizerHookAll
      this.useTokenizer(fallbackTokenizer, { 'match.list': false })
    }
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public useTokenizer(
    tokenizer: InlineTokenizer & Partial<InlineTokenizerHook>,
    lifecycleHookFlags: Partial<InlineTokenizerHookFlags> = {},
  ): this {
    // eslint-disable-next-line no-param-reassign
    tokenizer.getContext = this.getContext as () => ImmutableInlineTokenizerContext

    // register into tokenizerMap
    for (const t of tokenizer.uniqueTypes) {
      invariant(
        !this.tokenizerMap.has(t),
        `[DBTContext#useTokenizer] tokenizer for type(${ t }) has been registered!`
      )
      this.tokenizerMap.set(t, tokenizer)
    }

    const hook = tokenizer as InlineTokenizer & InlineTokenizerHookAll

    // register into this.*Hooks
    const registerIntoHookList = (
      hooks: InlineTokenizer[],
      flag: keyof InlineTokenizerHookFlags,
    ): void => {
      if (lifecycleHookFlags[flag] === false) return
      const index = hooks.findIndex(p => p.priority < hook.priority)
      if (index < 0) hooks.push(hook)
      else hooks.splice(index, 0, hook)
    }

    // register into this.*HookMap
    const registerIntoHookMap = (
      hookMap: Map<YastInlineNodeType, InlineTokenizer>,
      flag: keyof InlineTokenizerHookFlags,
    ): void => {
      if (lifecycleHookFlags[flag] === false) return
      for (const t of hook.uniqueTypes) {
        hookMap.set(t, hook)
      }
    }

    // match phase
    if (
      hook.eatDelimiters != null &&
      hook.eatPotentialTokens != null &&
      hook.match != null
    ) {
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
    return this
  }

  /**
   * @override
   */
  public match(
    rawContent: RawContent,
    _startIndex: number,
    _endIndex: number,
  ): InlineTokenizerMatchPhaseStateTree {
    const self = this
    const hooks = self.matchPhaseHooks
    const { nodePoints } = rawContent

    const recursivelyProcessPotentialTokens = (
      intervalNode: IntervalNode<InlinePotentialToken>,
      nextTokenizerIndex: number,
    ): void => {
      const potentialToken = intervalNode.value
      if (potentialToken.innerRawContents == null) return

      const children: IntervalNode<InlinePotentialToken>[] = []
      for (let i = 0, k = 0; i < potentialToken.innerRawContents.length; ++i) {
        const innerRawContent = potentialToken.innerRawContents[i]
        const intervalNodes: IntervalNode<InlinePotentialToken>[] = []
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
      innerIntervalNodes: IntervalNode<InlinePotentialToken>[],
    ): IntervalNode<InlinePotentialToken>[] => {
      /**
       *
       * @param hook
       */
      let intervals = innerIntervalNodes
      const eatDelimiters = (
        hook: InlineTokenizer & InlineTokenizerMatchPhaseHook
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
            precedingCodePosition: i > startIndex ? nodePoints[i - 1] : null,
            followingCodePosition: iat.startIndex < endIndex ? nodePoints[iat.startIndex] : null,
          })
          if (result.done) return result.value
          i = iat.endIndex
        }

        if (i < endIndex) {
          result = g.next({
            startIndex: i,
            endIndex,
            precedingCodePosition: i > startIndex ? nodePoints[i - 1] : null,
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
                self.shouldAcceptEdgeOfMatchStateTree,
              )
            }
            currentPriorityIntervals = []
          }

          const delimiters = eatDelimiters(hook)
          const potentialTokens = hook.eatPotentialTokens(rawContent, delimiters)
          for (const potentialToken of potentialTokens) {
            const intervalNode = self.mapPotentialTokenToIntervalNode(potentialToken)
            currentPriorityIntervals.push(intervalNode)
          }
        }

        if (currentPriorityIntervals.length > 0) {
          intervals = assembleToIntervalTrees(
            removeIntersectIntervals([...intervals, ...currentPriorityIntervals]),
            (intervalNode) => recursivelyProcessPotentialTokens(intervalNode, hooks.length),
            self.shouldAcceptEdgeOfMatchStateTree,
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
        const hook = self.fallbackTokenizer
        const fallbackDelimiters = eatDelimiters(hook)
        const fallbackTokens = hook.eatPotentialTokens(rawContent, fallbackDelimiters)
        const fallbackIntervals = fallbackTokens.map(self.mapPotentialTokenToIntervalNode)
        if (fallbackIntervals.length > 0) {
          intervals = assembleToIntervalTrees(
            removeIntersectIntervals([...intervals, ...fallbackIntervals]),
            (intervalNode) => recursivelyProcessPotentialTokens(intervalNode, hooks.length),
            self.shouldAcceptEdgeOfMatchStateTree,
          )
        }
      }

      return intervals
    }

    const buildMatchPhaseStateTree = (
      stateNodes: IntervalNode<InlinePotentialToken>[]
    ): InlineTokenizerMatchPhaseState[] => {
      const results: InlineTokenizerMatchPhaseState[] = []
      for (const stateNode of stateNodes) {
        const potentialToken = stateNode.value
        const hook = self.matchPhaseHookMap.get(potentialToken.type)!
        const innerStates = buildMatchPhaseStateTree(stateNode.children)
        const state = hook.match(rawContent, potentialToken, innerStates)
        if (state != null) {
          results.push(state)
        }
      }
      return results
    }

    const potentialTokens = processPotentialTokens(_startIndex, _endIndex, 0, [])
    const root: InlineTokenizerMatchPhaseStateTree = {
      type: 'root',
      startIndex: 0,
      endIndex: nodePoints.length,
      children: buildMatchPhaseStateTree(potentialTokens),
    }
    return root
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
        for (const hook of self.postMatchPhaseHooks) {
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

    handle(matchPhaseStateTree)
    return matchPhaseStateTree
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
        throw new TypeError(`[parse] no tokenizer matched \`${ o.type }\` found`)
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
      const parsePhaseState = hook.parse(rawContent, o, children)
      return parsePhaseState
    }

    const children = matchPhaseStateTree.children.map(handle)
    const parsePhaseStateTree: InlineTokenizerParsePhaseStateTree = {
      type: 'root',
      children,
    }
    return parsePhaseStateTree
  }

  /**
   * Whether to accept the given edges when building the state tree
   *
   * @param parent
   * @param child
   */
  protected shouldAcceptEdgeOfMatchStateTree = (
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
   * Map InlinePotentialToken to IntervalNode to use the tool function for
   * processing IntervalNode
   *
   * @param potentialToken
   */
  protected mapPotentialTokenToIntervalNode = (
    potentialToken: InlinePotentialToken,
  ): IntervalNode<InlinePotentialToken> => {
    return {
      value: potentialToken,
      startIndex: potentialToken.startIndex,
      endIndex: potentialToken.endIndex,
      children: [],
    }
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => ImmutableInlineTokenizerContext<M>) {
    const context: ImmutableInlineTokenizerContext<M> = Object.freeze({
      match: this.match.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}
