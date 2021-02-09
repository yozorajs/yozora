import type {
  YastMeta,
  YastNode,
  YastNodeType,
  YastRoot,
} from '@yozora/tokenizercore'
import type {
  BlockTokenizerContext,
  BlockTokenizerContextMatchPhaseState,
  BlockTokenizerContextMatchPhaseStateTree,
  BlockTokenizerContextPostMatchPhaseState,
  BlockTokenizerContextPostMatchPhaseStateTree,
  BlockTokenizerHook,
  BlockTokenizerHookAll,
  BlockTokenizerHookFlags,
  ImmutableBlockTokenizerContext,
} from './types/context'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
} from './types/lifecycle/match'
import type { BlockTokenizerParsePhaseHook } from './types/lifecycle/parse'
import type {
  BlockTokenizerPostMatchPhaseHook,
  BlockTokenizerPostMatchPhaseState,
} from './types/lifecycle/post-match'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
} from './types/phrasing-content'
import type { BlockTokenizer, FallbackBlockTokenizer } from './types/tokenizer'
import invariant from 'tiny-invariant'
import { NodePoint } from '@yozora/character'
import { isLineEnding } from '@yozora/character'
import { createBlockContentProcessor } from './processor'
import { PhrasingContentType } from './types/phrasing-content'
import { calcPositionFromPhrasingContentLines } from './util'


/**
 * Params for constructing DefaultBlockTokenizerContext
 */
export interface DefaultBlockTokenizerContextProps {
  /**
   * Fallback BlockTokenizer
   */
  readonly fallbackTokenizer?:
  | FallbackBlockTokenizer<
    YastNodeType & any,
    BlockTokenizerMatchPhaseState & any,
    BlockTokenizerPostMatchPhaseState & any,
    YastNode & any>
  | null

  /**
   * Type of YastNode which could has laziness contents
   * @default [PhrasingContentType].concat(fallbackTokenizer.uniqueTypes)
   */
  readonly lazinessTypes?: YastNodeType[]
}


/**
 * Default context of BlockTokenizer
 */
export class DefaultBlockTokenizerContext<M extends YastMeta = YastMeta>
  implements BlockTokenizerContext<M> {
  protected readonly getContext = this.createImmutableContext()
  protected readonly fallbackTokenizer: FallbackBlockTokenizer | null = null
  protected readonly lazinessTypes: YastNodeType[] = [PhrasingContentType]
  protected readonly matchPhaseHooks: (
    BlockTokenizerMatchPhaseHook & BlockTokenizer)[]
  protected readonly postMatchPhaseHooks: (
    BlockTokenizerPostMatchPhaseHook & BlockTokenizer)[]
  protected readonly parsePhaseHookMap: Map<
    YastNodeType, BlockTokenizerParsePhaseHook & BlockTokenizer>

  public constructor(props: DefaultBlockTokenizerContextProps = {}) {
    this.matchPhaseHooks = []
    this.postMatchPhaseHooks = []
    this.parsePhaseHookMap = new Map()

    const fallbackTokenizer = props.fallbackTokenizer != null
      ? props.fallbackTokenizer
      : null
    if (fallbackTokenizer != null) {
      this.useFallbackTokenizer(fallbackTokenizer, props.lazinessTypes)
    }
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public useFallbackTokenizer<T extends YastNodeType>(
    fallbackTokenizer: FallbackBlockTokenizer<
      T & any,
      BlockTokenizerMatchPhaseState<T> & any,
      BlockTokenizerPostMatchPhaseState<T> & any,
      YastNode & any>,
    lazinessTypes?: YastNodeType[],
  ): this {
    // Unmount old fallback tokenizer
    if (this.fallbackTokenizer != null) {
      const tokenizerName = this.fallbackTokenizer.name
        ; (this as any).fallbackTokenizer = null
      this.unmountTokenizer(tokenizerName)
    }

    // register fallback tokenizer
    this.useTokenizer(fallbackTokenizer, {
      'match': false,
      'post-match': false,
    })

    const self = this as unknown as {
      lazinessTypes: YastNodeType[]
      fallbackTokenizer: FallbackBlockTokenizer
    }
    const recognizedTypes = fallbackTokenizer != null
      ? fallbackTokenizer.recognizedTypes
      : []
    self.lazinessTypes = Array.isArray(lazinessTypes)
      ? [...new Set(lazinessTypes)]
      : [...new Set(recognizedTypes.concat(PhrasingContentType))]
    self.fallbackTokenizer = fallbackTokenizer
    return this
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public useTokenizer<T extends YastNodeType>(
    tokenizer:
      & BlockTokenizer<
        T & any,
        BlockTokenizerMatchPhaseState<T> & any,
        BlockTokenizerPostMatchPhaseState<T> & any>
      & Partial<BlockTokenizerHook>,
    lifecycleHookFlags: Partial<BlockTokenizerHookFlags> = {},
  ): this {
    // eslint-disable-next-line no-param-reassign
    tokenizer.getContext = this.getContext as () => ImmutableBlockTokenizerContext
    const hook = tokenizer as BlockTokenizer & BlockTokenizerHookAll

    // Register into this.*Hooks.
    const registerIntoHookList = (
      hooks: BlockTokenizer[],
      flag: keyof BlockTokenizerHookFlags,
    ): void => {
      if (lifecycleHookFlags[flag] === false) return
      hooks.push(hook)
    }

    // Register into this.*HookMap
    const registerIntoHookMap = (
      recognizedTypes: ReadonlyArray<YastNodeType>,
      hookMap: Map<YastNodeType, BlockTokenizer>,
      flag: keyof BlockTokenizerHookFlags,
    ): void => {
      if (lifecycleHookFlags[flag] === false) return
      for (const t of recognizedTypes) {
        if (hookMap.has(t)) continue
        hookMap.set(t, hook)
      }
    }

    // pre-match phase
    if (hook.eatOpener != null) {
      registerIntoHookList(this.matchPhaseHooks, 'match')
    }

    // post-match phase
    if (hook.transformMatch != null) {
      registerIntoHookList(this.postMatchPhaseHooks, 'post-match')
    }

    // parse phase
    if (hook.parse != null) {
      registerIntoHookMap(hook.recognizedTypes, this.parsePhaseHookMap, 'parse')
    }
    return this
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public unmountTokenizer(tokenizerName: string): this {
    invariant(
      this.fallbackTokenizer == null || this.fallbackTokenizer.name !== tokenizerName,
      'Cannot unmount fallbackTokenizer, please use `useFallbackTokenizer()` instead.'
    )

    // Unmount from this.*Hooks
    const unmountFromHookList = (hooks: BlockTokenizer[]): void => {
      const hookIndex = this.matchPhaseHooks
        .findIndex(hook => hook.name === tokenizerName)
      if (hookIndex >= 0) hooks.splice(hookIndex, 1)
    }

    // Unmount from this.*HookMap
    const unmountFromHookMap = (
      hookMap: Map<YastNodeType, BlockTokenizer>
    ): void => {
      [...hookMap.entries()]
        .filter(entry => entry[1].name === tokenizerName)
        .forEach(entry => hookMap.delete[entry[0]])
    }

    unmountFromHookList(this.matchPhaseHooks)
    unmountFromHookList(this.postMatchPhaseHooks)
    unmountFromHookMap(this.parsePhaseHookMap)
    return this
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public match(
    nodePoints: ReadonlyArray<NodePoint>,
    startIndex: number,
    endIndex: number,
  ): BlockTokenizerContextMatchPhaseStateTree {
    const processor = createBlockContentProcessor(
      this.matchPhaseHooks,
      this.fallbackTokenizer
    )

    for (
      let lineNo = 1, startIndexOfLine = startIndex, endIndexOfLine: number;
      startIndexOfLine < endIndex;
      lineNo += 1, startIndexOfLine = endIndexOfLine
    ) {
      // find the index of the end of current line
      for (endIndexOfLine = startIndexOfLine; endIndexOfLine < endIndex; ++endIndexOfLine) {
        if (isLineEnding(nodePoints[endIndexOfLine].codePoint)) {
          endIndexOfLine += 1
          break
        }
      }
      processor.consume(nodePoints, startIndexOfLine, endIndexOfLine)
    }

    const root = processor.done()
    return root
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public postMatch(
    nodePoints: ReadonlyArray<NodePoint>,
    matchPhaseStateTree: BlockTokenizerContextMatchPhaseStateTree,
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
          states = hook.transformMatch(states, nodePoints)
        }
        result.children = states
      }

      return result
    }

    const root: BlockTokenizerContextPostMatchPhaseState = handle(
      matchPhaseStateTree as BlockTokenizerContextMatchPhaseState
    )

    const tree: BlockTokenizerContextPostMatchPhaseStateTree = {
      type: 'root',
      position: root.position,
      children: root.children!,
    }
    return tree
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public parse(
    nodePoints: ReadonlyArray<NodePoint>,
    stateTree: BlockTokenizerContextPostMatchPhaseStateTree,
  ): YastRoot<M> {
    const metaDataNodes: YastNode[] = []

    /**
     * Post-order process.
     *
     * Parse BlockTokenizerMatchPhaseState list to YastNode list,
     * and categorize YastNodes.
     *
     * @param nodes
     */
    const handleFlowNodes = (
      nodes: BlockTokenizerContextPostMatchPhaseState[],
    ): YastNode[] => {
      const flowDataNodes: YastNode[] = []
      for (const o of nodes) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.parsePhaseHookMap.get(o.type)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[DBTContext#parse] no tokenizer for '${ o.type }' found`
        )

        // Post-order handle: Prioritize child nodes
        const children: YastNode[] | undefined = o.children != null
          ? handleFlowNodes(o.children)
          : undefined

        // Post-order handle: Perform BlockTokenizerParsePhaseHook
        const resultOfParse = hook.parse(o, children, nodePoints)
        if (resultOfParse == null) continue

        switch (resultOfParse.classification) {
          case 'flow':
            flowDataNodes.push(resultOfParse.node)
            break
          case 'meta':
            metaDataNodes.push(resultOfParse.node)
            break
          case 'flowAndMeta':
            flowDataNodes.push(resultOfParse.node)
            metaDataNodes.push(resultOfParse.node)
            break
        }
      }
      return flowDataNodes
    }

    // parse flow
    const children: YastNode[] =
      handleFlowNodes(stateTree.children)

    // parse meta
    const meta: YastMeta = {}
    const rawMeta: Record<YastNodeType, YastNode[]> = {}
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
      const vo = hook.parseMeta(states, nodePoints)
      meta[t] = vo
    }

    const tree: YastRoot<M> = {
      type: 'root',
      meta: meta as M,
      children,
    }
    return tree
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public extractPhrasingContentLines(
    state: BlockTokenizerMatchPhaseState,
  ): ReadonlyArray<PhrasingContentLine> | null {
    const tokenizer = this.parsePhaseHookMap.get(state.type)

    // no tokenizer for `matchPhaseState.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentLines == null) return null
    return tokenizer.extractPhrasingContentLines(state)
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public buildPhrasingContentPostMatchPhaseState(
    nodePoints: ReadonlyArray<NodePoint>,
    _lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentPostMatchPhaseState | null {
    const lines = _lines.filter(line => line.startIndex < line.endIndex)
    if (lines.length <= 0) return null

    const position = calcPositionFromPhrasingContentLines(lines)
    if (position == null) return null

    return { type: PhrasingContentType, lines, position }
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public buildPhrasingContentParsePhaseState(
    nodePoints: ReadonlyArray<NodePoint>,
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContent | null {
    const state = this.buildPhrasingContentPostMatchPhaseState(nodePoints, lines)
    if (state == null || this.fallbackTokenizer == null) return null
    return this.fallbackTokenizer.buildPhrasingContent(state)
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public buildPostMatchPhaseState(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalState: Readonly<BlockTokenizerPostMatchPhaseState>,
  ): BlockTokenizerPostMatchPhaseState | null {
    const originalType = originalState.type
    const tokenizer = this.parsePhaseHookMap.get(originalType)
    if (tokenizer == null || tokenizer.buildPostMatchPhaseState == null) return null
    return tokenizer.buildPostMatchPhaseState(lines, originalState)
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => ImmutableBlockTokenizerContext<M>) {
    const context: ImmutableBlockTokenizerContext<M> = Object.freeze({
      extractPhrasingContentLines:
        this.extractPhrasingContentLines.bind(this),
      buildPhrasingContentPostMatchPhaseState:
        this.buildPhrasingContentPostMatchPhaseState.bind(this),
      buildPhrasingContentParsePhaseState:
        this.buildPhrasingContentParsePhaseState.bind(this),
      buildPostMatchPhaseState:
        this.buildPostMatchPhaseState.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}
