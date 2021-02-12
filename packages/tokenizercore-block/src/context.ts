import type { NodePoint } from '@yozora/character'
import type {
  YastMeta,
  YastNode,
  YastNodeType,
  YastRoot,
} from '@yozora/tokenizercore'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentState,
} from './phrasing-content/types'
import type {
  BlockTokenizerContext,
  BlockTokenizerHook,
  BlockTokenizerHookAll,
  BlockTokenizerHookFlags,
  ImmutableBlockTokenizerContext,
  YastBlockStateTree,
} from './types/context'
import type {
  BlockTokenizerMatchPhaseHook,
  YastBlockState,
} from './types/lifecycle/match'
import type { BlockTokenizerParsePhaseHook } from './types/lifecycle/parse'
import type {
  BlockTokenizerPostMatchPhaseHook,
} from './types/lifecycle/post-match'
import type { BlockTokenizer, FallbackBlockTokenizer } from './types/tokenizer'
import invariant from 'tiny-invariant'
import { isLineEnding } from '@yozora/character'
import { PhrasingContentType } from './phrasing-content/types'
import {
  buildPhrasingContent,
  buildPhrasingContentState,
} from './phrasing-content/util'
import { createBlockContentProcessor } from './processor'


/**
 * Params for constructing DefaultBlockTokenizerContext
 */
export interface DefaultBlockTokenizerContextProps {
  /**
   * Fallback BlockTokenizer
   */
  readonly fallbackTokenizer?:
  | FallbackBlockTokenizer<YastNodeType, YastBlockState & any, YastNode & any>
  | null

  /**
   * Type of YastNode which could has laziness contents
   * @default [PhrasingContentType].concat(fallbackTokenizer.uniqueTypes)
   */
  readonly lazinessTypes?: YastNodeType[]

  /**
   * Whether it is necessary to reserve the position in the YastNode produced.
   */
  readonly shouldReservePosition?: boolean
}


/**
 * Default context of BlockTokenizer
 */
export class DefaultBlockTokenizerContext<M extends YastMeta = YastMeta>
  implements BlockTokenizerContext<M> {
  protected readonly getContext = this.createImmutableContext()
  protected readonly fallbackTokenizer: FallbackBlockTokenizer | null = null
  protected readonly lazinessTypes: YastNodeType[] = [PhrasingContentType]
  protected readonly shouldReservePosition: boolean
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
    this.shouldReservePosition = props.shouldReservePosition != null
      ? Boolean(props.shouldReservePosition)
      : false

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
      T, YastBlockState<T> & any, YastNode & any>,
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
      & BlockTokenizer<T & any, YastBlockState<T> & any>
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
  ): YastBlockStateTree {
    const processor = createBlockContentProcessor(
      this.getContext(),
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
    matchPhaseStateTree: YastBlockStateTree,
  ): YastBlockStateTree {
    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (o: YastBlockState): YastBlockState => {
      const result: YastBlockState = { ...o }
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

    const root: YastBlockStateTree = handle(matchPhaseStateTree) as YastBlockStateTree
    return root
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public parse(
    nodePoints: ReadonlyArray<NodePoint>,
    stateTree: YastBlockStateTree,
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
    const handleFlowNodes = (nodes: YastBlockState[]): YastNode[] => {
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

        const { classification, node } = resultOfParse
        if (this.shouldReservePosition) node.position = o.position

        switch (classification) {
          case 'flow':
            flowDataNodes.push(node)
            break
          case 'meta':
            metaDataNodes.push(node)
            break
          case 'flowAndMeta':
            flowDataNodes.push(node)
            metaDataNodes.push(node)
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

    if (this.shouldReservePosition) tree.position = stateTree.position
    return tree
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public buildPhrasingContentState(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentState | null {
    return buildPhrasingContentState(lines)
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public buildPhrasingContent(
    state: Readonly<PhrasingContentState>,
  ): PhrasingContent | null {
    return buildPhrasingContent(state)
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public buildBlockState(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalState: Readonly<YastBlockState>,
  ): YastBlockState | null {
    const originalType = originalState.type
    const tokenizer = this.parsePhaseHookMap.get(originalType)
    if (tokenizer == null || tokenizer.buildBlockState == null) return null
    return tokenizer.buildBlockState(lines, originalState)
  }

  /**
   * @override
   * @see BlockTokenizerContext
   */
  public extractPhrasingContentLines(
    originalState: Readonly<YastBlockState>,
  ): ReadonlyArray<PhrasingContentLine> | null {
    const tokenizer = this.parsePhaseHookMap.get(originalState.type)

    // no tokenizer for `matchPhaseState.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentLines == null) return null
    return tokenizer.extractPhrasingContentLines(originalState)
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => ImmutableBlockTokenizerContext<M>) {
    const context: ImmutableBlockTokenizerContext<M> = Object.freeze({
      buildPhrasingContentState: this.buildPhrasingContentState.bind(this),
      buildPhrasingContent: this.buildPhrasingContent.bind(this),
      buildBlockState: this.buildBlockState.bind(this),
      extractPhrasingContentLines: this.extractPhrasingContentLines.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}
