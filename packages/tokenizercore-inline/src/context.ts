import type {
  ImmutableInlineTokenizerContext,
  InlineTokenizerContext,
  InlineTokenizerContextMatchPhaseState,
  InlineTokenizerContextMatchPhaseStateTree,
  InlineTokenizerContextParsePhaseState,
  InlineTokenizerContextParsePhaseStateTree,
  InlineTokenizerContextPostMatchPhaseState,
  InlineTokenizerContextPostMatchPhaseStateTree,
  InlineTokenizerHook,
  InlineTokenizerHookAll,
  InlineTokenizerHookFlags,
} from './types/context'
import type { YastInlineNodeType } from './types/node'
import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
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
import invariant from 'tiny-invariant'
import {
  EnhancedYastNodePoint,
  YastMeta,
  compareInterval,
  removeIntersectIntervals,
} from '@yozora/tokenizercore'
import { assembleToIntervalTrees } from './util/interval'


/**
 * Params for constructing DefaultInlineTokenizerContext
 */
export interface DefaultInlineTokenizerContextProps {
  /**
   *
   */
  readonly fallbackTokenizer?:
  | FallbackInlineTokenizer<
    YastInlineNodeType & string,
    InlineTokenDelimiter & any,
    InlinePotentialToken & any,
    InlineTokenizerMatchPhaseState & any,
    InlineTokenizerParsePhaseState & any>
  | null
}


/**
 * Default context of InlineTokenizer
 */
export class DefaultInlineTokenizerContext<M extends Readonly<YastMeta> = Readonly<YastMeta>>
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
      this.useTokenizer(this.fallbackTokenizer, { 'match.list': false })
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
      hook.eatPotentialTokens != null
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
   * @see InlineTokenizerContext
   */
  public match(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: M,
    phrasingContentStartIndex: number,
    phrasingContentEndIndex: number,
  ): InlineTokenizerContextMatchPhaseStateTree {
    const process = (
      state: InlineTokenizerContextMatchPhaseState,
      nextHookIndex: number,
    ): void => {
      if (state.innerRawContents == null) return

      const children: InlineTokenizerContextMatchPhaseState[] = []
      for (let i = 0, k = 0; i < state.innerRawContents.length; ++i) {
        const innerRawContent = state.innerRawContents[i]
        const innerStates: InlineTokenizerContextMatchPhaseState[] = []

        // Find first index `k` of the states which included in the interval
        // range of innerRawContent.
        for (; k < state.children.length; ++k) {
          const o = state.children[k]
          if (o.startIndex >= innerRawContent.startIndex) break
        }

        // Collect all states included in the interval range of innerRawContent.
        for (; k < state.children.length; ++k) {
          const o = state.children[k]
          if (o.endIndex > innerRawContent.endIndex) break
          innerStates.push(o)
        }

        // Find all inner states in the interval range.
        const states: InlineTokenizerContextMatchPhaseState[] = deepProcess(
          state,
          innerStates,
          innerRawContent.startIndex,
          innerRawContent.endIndex,
          nextHookIndex,
        )
        children.push(...states)
      }

      // eslint-disable-next-line no-param-reassign
      state.children = children
    }

    /**
     * Return ordered and disjoint intervals
     *
     * @param innerStates
     * @param startIndex
     * @param endIndex
     * @param hookStartIndex
     */
    const deepProcess = (
      parent: Readonly<InlineTokenizerContextMatchPhaseState>,
      innerStates: InlineTokenizerContextMatchPhaseState[],
      startIndex: number,
      endIndex: number,
      hookStartIndex: number,
    ): InlineTokenizerContextMatchPhaseState[] => {
      let states: InlineTokenizerContextMatchPhaseState[] = innerStates

      const eatDelimiters = (
        hook: InlineTokenizer & InlineTokenizerMatchPhaseHook
      ): InlineTokenDelimiter[] => {
        const g = hook.eatDelimiters(nodePoints, meta)
        let result: IteratorResult<void, InlineTokenDelimiter[]> = g.next()
        if (result.done) return result.value

        let i = startIndex
        for (const iat of states) {
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

        invariant(
          result.done,
          `[DITContext] bad generator returned by ${ hook.name }.eatDelimiters`
        )

        return result.value
      }

      // Parse InlinePotentialToken to InlineTokenizerContextMatchPhaseState
      // and merge them into the states
      const mergeTokens = (
        tokens: InlinePotentialToken[],
        nextHookIndex: number,
      ): void => {
        const rawPeerStates: InlineTokenizerContextMatchPhaseState[] =
          mapPTokens2MatchStates(parent, tokens).sort(compareInterval)
        const peerStates = this.removePeerIntersectStates(rawPeerStates)

        states = assembleToIntervalTrees(
          states.concat(peerStates).sort(compareInterval),
          state => process(state, nextHookIndex),
          // this.shouldAcceptChild,
        )
      }

      const hooks = this.matchPhaseHooks
      if (hookStartIndex < hooks.length) {
        let currentPriority: number = hooks[hookStartIndex].priority
        let currentPriorityTokens: InlinePotentialToken[] = []
        for (let hIndex = hookStartIndex; hIndex < hooks.length; ++hIndex) {
          const hook = hooks[hIndex]
          if (hook.priority != currentPriority) {
            currentPriority = hook.priority
            if (currentPriorityTokens.length > 0) {
              mergeTokens(currentPriorityTokens, hIndex)
            }
            currentPriorityTokens = []
          }

          const delimiters = eatDelimiters(hook)
          const potentialTokens = hook.eatPotentialTokens(nodePoints, meta, delimiters)
          currentPriorityTokens.push(...potentialTokens)
        }

        if (currentPriorityTokens.length > 0) {
          mergeTokens(currentPriorityTokens, hooks.length)
        }
      }

      /**
       * There is still unknown content, use FallbackTokenizer if it exists
       * and implements the pre-match hook
       */
      if (
        this.fallbackTokenizer != null
        && this.fallbackTokenizer.eatDelimiters != null
      ) {
        const hook = this.fallbackTokenizer
        const fallbackDelimiters = eatDelimiters(hook)
        const fallbackTokens = hook.eatPotentialTokens(nodePoints, meta, fallbackDelimiters)
        if (fallbackTokens.length > 0) {
          mergeTokens(fallbackTokens, hooks.length)
        }
      }

      return states
    }

    /**
     * Call `beforeClose()` for every node
     * of the InlineTokenizerContextMatchPhaseStateTree
     *
     * @param state
     */
    const close = (state: InlineTokenizerContextMatchPhaseState): void => {
      if (state.children != null && state.children.length > 0) {
        state.children.forEach(close)
      }

      const tokenizer = this.matchPhaseHookMap.get(state.data.type)
      if (tokenizer!.beforeClose != null) {
        tokenizer!.beforeClose(nodePoints, meta, state.data)
      }
    }

    const root: InlineTokenizerContextMatchPhaseStateTree = {
      startIndex: phrasingContentStartIndex,
      endIndex: phrasingContentEndIndex,
      children: [],
      parent: null,
      data: { type: 'root' },
      innerRawContents: [{
        startIndex: phrasingContentStartIndex,
        endIndex: phrasingContentEndIndex,
      }],
    }

    process(root, 0)
    root.children.map(close)
    return root
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public postMatch(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    matchPhaseStateTree: InlineTokenizerContextMatchPhaseStateTree,
  ): InlineTokenizerContextPostMatchPhaseStateTree {
    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (
      o: InlineTokenizerContextMatchPhaseState
    ): InlineTokenizerContextPostMatchPhaseState => {
      const result: InlineTokenizerContextPostMatchPhaseState = {
        ...o.data,
      }

      if (o.children != null && o.children.length > 0) {
        // Post-order handle: Perform BlockTokenizerPostMatchPhaseHook
        let states = o.children.map(handle)
        for (const hook of this.postMatchPhaseHooks) {
          states = hook.transformMatch(nodePoints, meta, states)
        }
        result.children = states
      }

      return result
    }

    const root: InlineTokenizerContextPostMatchPhaseState = handle(matchPhaseStateTree)
    const tree: InlineTokenizerContextPostMatchPhaseStateTree = {
      type: 'root',
      children: root.children!,
    }
    return tree
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public parse(
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    postMatchPhaseStateTree: InlineTokenizerContextPostMatchPhaseStateTree,
  ): InlineTokenizerParsePhaseStateTree {
    /**
     * parse BlockTokenizerMatchPhaseState to BlockTokenizerParsePhaseState
     */
    const handleFlowNodes = (
      nodes: InlineTokenizerContextPostMatchPhaseState[],
    ): InlineTokenizerContextParsePhaseState[] => {
      const flowDataNodes: InlineTokenizerParsePhaseState[] = []
      for (const o of nodes) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.parsePhaseHookMap.get(o.type)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[DBTContext#parse] no tokenizer for '${ o.type }' found`
        )

        const children: InlineTokenizerContextParsePhaseState[] | undefined
          = o.children != null ? handleFlowNodes(o.children) : undefined
        const parsedState = hook.parse(nodePoints, meta, o, children)
        flowDataNodes.push(parsedState)
      }
      return flowDataNodes
    }

    const children: InlineTokenizerContextParsePhaseState[] =
      handleFlowNodes(postMatchPhaseStateTree.children)
    const parsePhaseStateTree: InlineTokenizerContextParsePhaseStateTree = {
      type: 'root',
      children,
    }
    return parsePhaseStateTree
  }

  /**
   * @override
   * @see InlineTokenizerContext
   */
  public removePeerIntersectStates(
    orderedStates: ReadonlyArray<InlineTokenizerContextMatchPhaseState>
  ): InlineTokenizerContextMatchPhaseState[] {
    return removeIntersectIntervals(orderedStates)
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => ImmutableInlineTokenizerContext<M>) {
    const context: ImmutableInlineTokenizerContext<M> = Object.freeze({
      match: this.match.bind(this),
      postMatch: this.postMatch.bind(this),
      parse: this.parse.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}


/**
 * Map InlinePotentialToken list to InlineTokenizerContextMatchPhaseState list.
 *
 * @param parent
 * @param potentialToken
 */
function mapPTokens2MatchStates(
  parent: InlineTokenizerContextMatchPhaseState | null,
  potentialTokens: ReadonlyArray<InlinePotentialToken>,
): InlineTokenizerContextMatchPhaseState[] {
  const states: InlineTokenizerContextMatchPhaseState[] = potentialTokens.map(
    ({ startIndex, endIndex, state, innerRawContents }) => ({
      startIndex,
      endIndex,
      children: [],
      parent,
      data: state,
      innerRawContents,
    }))
  return states
}
