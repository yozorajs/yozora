import type { NodePoint } from '@yozora/character'
import type {
  BlockFallbackTokenizer,
  InlineFallbackTokenizer,
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentState,
  Tokenizer,
  TokenizerContext,
  TokenizerMatchBlockHook,
  TokenizerMatchInlineHook,
  TokenizerParseBlockHook,
  TokenizerParseInlineHook,
  TokenizerPostMatchBlockHook,
  YastBlockState,
  YastMeta,
  YastNode,
  YastNodeType,
  YastParent,
  YastRoot,
  YastToken,
} from '@yozora/tokenizercore'
import type {
  TokenizerHook,
  TokenizerHookAll,
  TokenizerHookPhaseFlags,
  YastBlockStateTree,
  YastParser,
} from './types'
import invariant from 'tiny-invariant'
import { createNodePointGenerator, isLineEnding } from '@yozora/character'
import {
  PhrasingContentType,
  buildPhrasingContent,
  buildPhrasingContentState,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/tokenizercore'
import { createBlockContentProcessor } from './processor/block'
import { createPhrasingContentProcessor } from './processor/inline'


/**
 * Parameters for constructing a DefaultYastParser.
 */
export interface DefaultYastParserProps {
  /**
   * Fallback tokenizer on processing block structure phase.
   */
  readonly blockFallbackTokenizer?: BlockFallbackTokenizer<
    YastNodeType, YastBlockState & any, YastNode & any>

  /**
   * Fallback tokenizer on processing inline structure phase.
   */
  readonly inlineFallbackTokenizer?: InlineFallbackTokenizer<
    YastNodeType, YastMeta & any, YastToken & any, YastNode & any>

  /**
   * Type of YastNode which could has laziness contents
   * @default [PhrasingContentType].concat(blockFallbackTokenizer.uniqueTypes)
   */
  readonly lazinessTypes?: YastNodeType[]

  /**
   * Whether it is necessary to reserve the position in the YastNode produced.
   * @default false
   */
  readonly shouldReservePosition?: boolean
}


export class DefaultYastParser<Meta extends YastMeta = YastMeta> implements YastParser {
  protected readonly getContext = this.createImmutableContext()
  protected readonly tokenizerHookMap: Map<YastNodeType, Tokenizer & Partial<TokenizerHookAll>>
  protected readonly matchBlockHooks: (Tokenizer & TokenizerMatchBlockHook)[]
  protected readonly postMatchBlockHooks: (Tokenizer & TokenizerPostMatchBlockHook)[]
  protected readonly parseBlockHookMap: Map<YastNodeType, Tokenizer & TokenizerParseBlockHook>
  protected readonly matchInlineHooks: (Tokenizer & TokenizerMatchInlineHook)[]
  protected readonly parseInlineHookMap: Map<YastNodeType, Tokenizer & TokenizerParseInlineHook>
  protected readonly blockFallbackTokenizer: BlockFallbackTokenizer | null = null
  protected readonly inlineFallbackTokenizer: InlineFallbackTokenizer | null = null
  protected readonly lazinessTypes: YastNodeType[] = [PhrasingContentType]
  protected defaultShouldReservePosition: boolean

  public constructor(props: DefaultYastParserProps) {
    this.tokenizerHookMap = new Map()
    this.matchBlockHooks = []
    this.postMatchBlockHooks = []
    this.parseBlockHookMap = new Map()
    this.matchInlineHooks = []
    this.parseInlineHookMap = new Map()
    this.defaultShouldReservePosition = props.shouldReservePosition == null
      ? false
      : Boolean(props.shouldReservePosition)

    // Resolve block fallback tokenizer.
    const blockFallbackTokenizer = props.blockFallbackTokenizer != null
      ? props.blockFallbackTokenizer
      : null
    if (blockFallbackTokenizer != null) {
      this.useBlockFallbackTokenizer(blockFallbackTokenizer, props.lazinessTypes)
    }

    // Resolve inline fallback tokenizer.
    const inlineFallbackTokenizer = props.inlineFallbackTokenizer != null
      ? props.inlineFallbackTokenizer
      : null
    if (inlineFallbackTokenizer != null) {
      this.useInlineFallbackTokenizer(inlineFallbackTokenizer)
    }
  }

  /**
   * @override
   * @see YastParser
   */
  public useTokenizer(
    tokenizer: Tokenizer & (Partial<TokenizerHook> | never),
    lifecycleHookFlags: Partial<TokenizerHookPhaseFlags> = {},
  ): this {
    const recognizedTypes: YastNodeType[] = Array.from(new Set(tokenizer.recognizedTypes || []))

    // Check if the recognizedType has been registered by other tokenizer.
    for (const t of recognizedTypes) {
      const olderTokenizer =  this.tokenizerHookMap.get(t)
      if (olderTokenizer != null) {
        throw new TypeError(
          `[useTokenizer] Type(${ t }) has been registered by tokenizer ${ olderTokenizer.name }.`)
      }
    }

    // Bind the type `t` with the tokenizer into the tokenizerHookMap.
    for (const t of recognizedTypes) this.tokenizerHookMap.set(t, tokenizer)

    // eslint-disable-next-line no-param-reassign
    tokenizer.getContext = this.getContext as () => TokenizerContext
    const hook = tokenizer as Tokenizer & TokenizerHookAll

    // Register into this.*Hooks.
    const registerIntoHookList = (
      hooks: Tokenizer[],
      flag: keyof TokenizerHookPhaseFlags,
      index = -1,
    ): void => {
      if (lifecycleHookFlags[flag] === false) return
      if (index < 0 || index >= hooks.length) hooks.push(hook)
      else hooks.splice(index, 0, hook)
    }

    // Register into this.*HookMap
    const registerIntoHookMap = (
      hookMap: Map<YastNodeType, Tokenizer>,
      flag: keyof TokenizerHookPhaseFlags,
    ): void => {
      if (lifecycleHookFlags[flag] === false) return
      for (const t of recognizedTypes) {
        if (hookMap.has(t)) continue
        hookMap.set(t, hook)
      }
    }

    // match-block phase
    if (hook.eatOpener != null) {
      registerIntoHookList(this.matchBlockHooks, 'match-block')
    }

    // post-match-block phase
    if (hook.transformMatch != null) {
      registerIntoHookList(this.postMatchBlockHooks, 'post-match-block')
    }

    // parse-block phase
    if (hook.parseBlock != null) {
      registerIntoHookMap(this.parseBlockHookMap, 'parse-block')
    }

    // match-inline phase
    if (hook.findDelimiter != null) {
      hook.isDelimiterPair = hook.isDelimiterPair == null
        ? () => ({ paired: true })
        : hook.isDelimiterPair
      hook.processDelimiterPair = hook.processDelimiterPair == null
        ? (openerDelimiter, closerDelimiter, innerTokens) => ({ token: innerTokens })
        : hook.processDelimiterPair.bind(hook)
      hook.processFullDelimiter = hook.processFullDelimiter == null
        ? () => null
        : hook.processFullDelimiter.bind(hook)

      registerIntoHookList(
        this.matchInlineHooks,
        'match-inline',
        this.matchInlineHooks.findIndex(x => x.delimiterPriority < hook.delimiterPriority))
    }

    // parse-inline phase
    if (hook.processToken != null) {
      registerIntoHookMap(this.parseInlineHookMap, 'parse-inline')
    }

    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public unmountTokenizer(tokenizerName: string): this {
    invariant(
      this.blockFallbackTokenizer == null
      || this.blockFallbackTokenizer.name !== tokenizerName,
      'Cannot unmount blockFallbackTokenizer, please use `useBlockFallbackTokenizer()` instead.')

    invariant(
      this.inlineFallbackTokenizer == null
      || this.inlineFallbackTokenizer.name !== tokenizerName,
      'Cannot unmount inlineFallbackTokenizer, please use `useInlineFallbackTokenizer()` instead.')

    // Unmount from this.*Hooks
    const unmountFromHookList = (hooks: Tokenizer[]): void => {
      const hookIndex = hooks
        .findIndex(hook => hook.name === tokenizerName)
      if (hookIndex >= 0) hooks.splice(hookIndex, 1)
    }

    // Unmount from this.*HookMap
    const unmountFromHookMap = (
      hookMap: Map<YastNodeType, Tokenizer>
    ): void => {
      [...hookMap.entries()]
        .filter(entry => entry[1].name === tokenizerName)
        .forEach(entry => hookMap.delete(entry[0]))
    }

    unmountFromHookMap(this.tokenizerHookMap)
    unmountFromHookList(this.matchBlockHooks)
    unmountFromHookList(this.postMatchBlockHooks)
    unmountFromHookMap(this.parseBlockHookMap)
    unmountFromHookList(this.matchInlineHooks)
    unmountFromHookMap(this.parseInlineHookMap)
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public useBlockFallbackTokenizer<T extends YastNodeType>(
    blockFallbackTokenizer: BlockFallbackTokenizer<
      T, YastBlockState<T> & any, YastNode & any>,
    lazinessTypes?: YastNodeType[],
  ): this {
    // Unmount old fallback tokenizer
    if (this.blockFallbackTokenizer != null) {
      const tokenizerName = this.blockFallbackTokenizer.name
        ; (this as any).blockFallbackTokenizer = null
      this.unmountTokenizer(tokenizerName)
    }

    // register fallback tokenizer
    this.useTokenizer(blockFallbackTokenizer, {
      'match-block': false,
      'post-match-block': false,
      'match-inline': false,
      'parse-inline': false,
    })

    const self = this as unknown as {
      lazinessTypes: YastNodeType[]
      blockFallbackTokenizer: BlockFallbackTokenizer
    }
    const recognizedTypes = blockFallbackTokenizer != null
      ? blockFallbackTokenizer.recognizedTypes
      : []
    self.lazinessTypes = Array.isArray(lazinessTypes)
      ? Array.from(new Set(lazinessTypes))
      : Array.from(new Set(recognizedTypes.concat(PhrasingContentType as T)))
    self.blockFallbackTokenizer = blockFallbackTokenizer
    return this
  }

    /**
   * @override
   * @see YastParser
   */
  public useInlineFallbackTokenizer(
    inlineFallbackTokenizer: InlineFallbackTokenizer<
      YastNodeType,
      YastMeta & any,
      YastToken & any,
      YastNode & any>
  ): this {
    // Unmount old fallback tokenizer
    if (this.inlineFallbackTokenizer != null) {
      const tokenizerName = this.inlineFallbackTokenizer.name
        ; (this as any).inlineFallbackTokenizer = null
      this.unmountTokenizer(tokenizerName)
    }

    // register fallback tokenizer
    this.useTokenizer(inlineFallbackTokenizer, {
      'match-block': false,
      'post-match-block': false,
      'parse-block': false,
      'match-inline': false,
    })

    const self = this as unknown as { inlineFallbackTokenizer: InlineFallbackTokenizer }
    self.inlineFallbackTokenizer = inlineFallbackTokenizer
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public parse(
    content: string,
    _startIndex?: number,
    _endIndex?: number,
    shouldReservePosition: boolean = this.defaultShouldReservePosition
  ): YastRoot {
    const result: YastRoot = {
      type: 'root',
      meta: {},
      children: [],
    }

    // calc nodePoints from content
    const nodePointGenerator = createNodePointGenerator(content)
    const nodePoints = nodePointGenerator.next(null).value!

    // Optimization: directly return when there are no non-blank characters
    if (nodePoints == null || nodePoints.length <= 0) {
      return result
    }

    const startIndex = Math.min(
      nodePoints.length - 1,
      Math.max(0, _startIndex == null ? 0 : _startIndex))
    const endIndex = Math.min(
      nodePoints.length,
      Math.max(0, _endIndex == null ? nodePoints.length : _endIndex))

    // Optimization: directly return when there are no non-blank characters
    if (startIndex >= endIndex) return result

    const matchPhaseStateTree = this.matchBlock(nodePoints, startIndex, endIndex)
    const postMatchPhaseStateTree = this.postMatchBlock(nodePoints, matchPhaseStateTree)
    const tree = this.parseBlock(nodePoints, postMatchPhaseStateTree, shouldReservePosition)

    const { children } = this.deepParse(tree, tree.meta, shouldReservePosition)
    result.meta = tree.meta
    result.children = children as YastNode[]
    if (this.defaultShouldReservePosition) result.position = tree.position
    return result
  }

  /**
   * Parse phrasingContent to inlines.
   *
   * @param o     current data node
   * @param meta  metadata of state tree
   * @param shouldReservePosition
   */
  protected deepParse(
    o: YastNode & YastParent,
    meta: Meta,
    shouldReservePosition: boolean,
  ): YastNode {
    if (o.children == null || o.children.length <= 0) return o

    const children: YastNode[] = []
    for (const u of o.children) {
      if (u.type === PhrasingContentType) {
        const phrasingContent = u as PhrasingContent
        const nodePoints: ReadonlyArray<NodePoint> = phrasingContent.contents
        const inlineStateTree = this.matchInline(
          0, nodePoints.length, nodePoints, meta)
        const parsePhaseMetaTree = this.parseInline(
          inlineStateTree, nodePoints, meta, shouldReservePosition)
        children.push(...parsePhaseMetaTree)
      } else {
        const v = this.deepParse(u as YastNode & YastParent, meta, shouldReservePosition)
        children.push(v)
      }
    }

    // eslint-disable-next-line no-param-reassign
    o.children = children
    return o
  }

  /**
   * match-block phase.
   */
  protected matchBlock(
    nodePoints: ReadonlyArray<NodePoint>,
    startIndex: number,
    endIndex: number,
  ): YastBlockStateTree {
    const processor = createBlockContentProcessor(
      this.getContext() as TokenizerContext,
      this.matchBlockHooks,
      this.blockFallbackTokenizer
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
   * post-match-block phase.
   */
  protected postMatchBlock(
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
        // Post-order handle: Perform TokenizerPostMatchBlockHook
        let states = o.children.map(handle)
        for (const hook of this.postMatchBlockHooks) {
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
   * parse-block phase.
   * @param nodePoints
   * @param stateTree
   * @param shouldReservePosition
   */
  protected parseBlock(
    nodePoints: ReadonlyArray<NodePoint>,
    stateTree: YastBlockStateTree,
    shouldReservePosition: boolean,
  ): YastRoot<Meta> {
    const metaDataNodes: YastNode[] = []

    /**
     * Post-order process.
     *
     * Parse YastBlockState list to YastNode list,
     * and categorize YastNodes.
     *
     * @param nodes
     */
    const handleFlowNodes = (nodes: YastBlockState[]): YastNode[] => {
      const flowDataNodes: YastNode[] = []
      for (const o of nodes) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.parseBlockHookMap.get(o.type)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[DBTContext#parse] no tokenizer for '${ o.type }' found`
        )

        // Post-order handle: Prioritize child nodes
        const children: YastNode[] | undefined = o.children != null
          ? handleFlowNodes(o.children)
          : undefined

        // Post-order handle: Perform TokenizerParseBlockHook
        const resultOfParse = hook.parseBlock(o, children, nodePoints)
        if (resultOfParse == null) continue

        const { classification, node } = resultOfParse
        if (shouldReservePosition) node.position = o.position

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
      const hook = this.parseBlockHookMap.get(t)
      invariant(
        hook != null && hook.parseMeta != null,
        `[DBTContext#parse] no tokenizer.parseMeta for '${ t }' found`
      )

      const states = rawMeta[t]
      const vo = hook.parseMeta(states, nodePoints)
      meta[t] = vo
    }

    const tree: YastRoot<Meta> = {
      type: 'root',
      meta: meta as Meta,
      children,
    }

    if (shouldReservePosition) tree.position = stateTree.position
    return tree
  }

  /**
   * match-inline phase.
   * @param startIndexOfBlock
   * @param endIndexOfBlock
   * @param nodePoints
   * @param meta
   */
  protected matchInline(
    startIndexOfBlock: number,
    endIndexOfBlock: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): YastToken[] {
    const processor = createPhrasingContentProcessor(this.matchInlineHooks)
    processor.process(startIndexOfBlock, endIndexOfBlock, nodePoints, meta)

    const tokensStack: YastToken[] = processor.done()
    const resolvedResults = this.resolveFallbackTokens(
      tokensStack,
      startIndexOfBlock,
      endIndexOfBlock,
      nodePoints,
      meta,
    )
    return resolvedResults
  }

  /**
   * parse-inline phase.
   * @param matchPhaseTokens
   * @param nodePoints
   * @param meta
   * @param shouldReservePosition
   */
  protected parseInline(
    matchPhaseTokens: YastToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
    shouldReservePosition: boolean,
  ): YastNode[] {
    const handle = (
      tokens: YastToken[],
    ): YastNode[] => {
      const results: YastNode[] = []
      for (const o of tokens) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.parseInlineHookMap.get(o.type)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[DBTContext#parse] no tokenizer for '${ o.type }' found`
        )

        const children: YastNode[] | undefined = o.children != null
          ? handle(o.children)
          : undefined
        const node = hook.processToken(o, children, nodePoints, meta)
        if (shouldReservePosition) {
          node.position = {
            start: calcStartYastNodePoint(nodePoints, o.startIndex),
            end: calcEndYastNodePoint(nodePoints, o.endIndex - 1),
          }
        }
        results.push(node)
      }
      return results
    }

    const results: YastNode[] = handle(matchPhaseTokens)
    return results
  }

  /**
   * @override
   * @see TokenizerContext
   */
  protected buildPhrasingContentState(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentState | null {
    return buildPhrasingContentState(lines)
  }

  /**
   * @override
   * @see TokenizerContext
   */
  protected buildPhrasingContent(
    state: Readonly<PhrasingContentState>,
  ): PhrasingContent | null {
    return buildPhrasingContent(state)
  }

  /**
   * @override
   * @see TokenizerContext
   */
  protected buildBlockState(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalState: Readonly<YastBlockState>,
  ): YastBlockState | null {
    const originalType = originalState.type
    const tokenizer = this.tokenizerHookMap.get(originalType) as TokenizerMatchBlockHook
    if (tokenizer == null || tokenizer.buildBlockState == null) return null
    return tokenizer.buildBlockState(lines, originalState)
  }

  /**
   * @override
   * @see TokenizerContext
   */
  protected extractPhrasingContentLines(
    originalState: Readonly<YastBlockState>,
  ): ReadonlyArray<PhrasingContentLine> | null {
    const tokenizer = this.tokenizerHookMap.get(originalState.type) as TokenizerMatchBlockHook

    // no tokenizer for `State.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentLines == null) return null
    return tokenizer.extractPhrasingContentLines(originalState)
  }

  /**
   * @override
   * @see TokenizerContext
   */
  public resolveFallbackTokens(
    tokens: ReadonlyArray<YastToken>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): YastToken[] {
    if (this.inlineFallbackTokenizer == null) return tokens.slice()

    const results: YastToken[] = []

    let i = startIndex
    for (const token of tokens) {
      if (i < token.startIndex) {
        const fallbackToken = this.inlineFallbackTokenizer
          .findAndHandleDelimiter(i, token.startIndex, nodePoints, meta)
        results.push(fallbackToken)
      }
      results.push(token)
      i = token.endIndex
    }

    if (i < endIndex) {
      const fallbackToken = this.inlineFallbackTokenizer
        .findAndHandleDelimiter(i, endIndex, nodePoints, meta)
      results.push(fallbackToken)
    }
    return results
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): (() => TokenizerContext<Meta>) {
    const context: TokenizerContext<Meta> = Object.freeze({
      buildPhrasingContentState: this.buildPhrasingContentState.bind(this),
      buildPhrasingContent: this.buildPhrasingContent.bind(this),
      buildBlockState: this.buildBlockState.bind(this),
      extractPhrasingContentLines: this.extractPhrasingContentLines.bind(this),
      resolveFallbackTokens: this.resolveFallbackTokens.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}
