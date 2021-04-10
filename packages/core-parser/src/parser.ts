import type {
  Root,
  RootMeta,
  YastNode,
  YastNodeType,
  YastParent,
} from '@yozora/ast'
import { calcDefinitions } from '@yozora/ast-util'
import type { NodePoint } from '@yozora/character'
import { createNodePointGenerator, isLineEnding } from '@yozora/character'
import type {
  BlockFallbackTokenizer,
  InlineFallbackTokenizer,
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentToken,
  Tokenizer,
  TokenizerContext,
  TokenizerMatchBlockHook,
  TokenizerMatchInlineHook,
  TokenizerParseBlockHook,
  TokenizerParseInlineHook,
  TokenizerPostMatchBlockHook,
  YastBlockToken,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import {
  PhrasingContentType,
  buildPhrasingContent,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import invariant from 'tiny-invariant'
import { PhrasingContentTokenizer } from './phrasing-content/tokenizer'
import { createBlockContentProcessor } from './processor/block'
import { createPhrasingContentProcessor } from './processor/inline'
import type {
  TokenizerHook,
  TokenizerHookAll,
  TokenizerHookPhaseFlags,
  YastBlockTokenTree,
  YastParser,
} from './types'

/**
 * Parameters for constructing a DefaultYastParser.
 */
export interface DefaultYastParserProps {
  /**
   * Fallback tokenizer on processing block structure phase.
   */
  readonly blockFallbackTokenizer?: BlockFallbackTokenizer

  /**
   * Fallback tokenizer on processing inline structure phase.
   */
  readonly inlineFallbackTokenizer?: InlineFallbackTokenizer

  /**
   * Whether it is necessary to reserve the position in the YastNode produced.
   * @default false
   */
  readonly shouldReservePosition?: boolean
}

export class DefaultYastParser<Meta extends RootMeta = RootMeta>
  implements YastParser {
  protected readonly getContext = this.createImmutableContext()
  protected readonly tokenizerHookMap: Map<
    YastNodeType,
    Tokenizer &
      Partial<TokenizerHookAll> &
      TokenizerParseBlockHook &
      TokenizerParseInlineHook
  >
  protected readonly matchBlockHooks: Array<Tokenizer & TokenizerMatchBlockHook>
  protected readonly postMatchBlockHooks: Array<
    Tokenizer & TokenizerPostMatchBlockHook
  >
  protected readonly matchInlineHooks: Array<
    Tokenizer & TokenizerMatchInlineHook
  >
  protected readonly phrasingContentTokenizer: PhrasingContentTokenizer
  protected blockFallbackTokenizer: BlockFallbackTokenizer | null = null
  protected inlineFallbackTokenizer: InlineFallbackTokenizer | null = null
  protected defaultShouldReservePosition: boolean

  constructor(props: DefaultYastParserProps) {
    this.defaultShouldReservePosition =
      props.shouldReservePosition == null
        ? false
        : Boolean(props.shouldReservePosition)

    this.tokenizerHookMap = new Map()
    this.matchBlockHooks = []
    this.postMatchBlockHooks = []
    this.matchInlineHooks = []
    this.phrasingContentTokenizer = new PhrasingContentTokenizer()

    // Register phrasing-content tokenizer.
    this.useTokenizer(new PhrasingContentTokenizer(), {
      'match-block': false,
      'post-match-block': false,
      'match-inline': false,
    })

    // Resolve block fallback tokenizer.
    const blockFallbackTokenizer =
      props.blockFallbackTokenizer != null ? props.blockFallbackTokenizer : null
    if (blockFallbackTokenizer != null) {
      this.useBlockFallbackTokenizer(blockFallbackTokenizer)
    }

    // Resolve inline fallback tokenizer.
    const inlineFallbackTokenizer =
      props.inlineFallbackTokenizer != null
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
    // Check if the tokenizer name has been registered by other tokenizer.
    const olderTokenizer = this.tokenizerHookMap.get(tokenizer.name)
    if (olderTokenizer != null) {
      throw new TypeError(
        `[useTokenizer] Name(${tokenizer.name}) has been registered.`,
      )
    }

    const hook = tokenizer as Tokenizer & TokenizerHookAll
    this.tokenizerHookMap.set(tokenizer.name, hook)

    // eslint-disable-next-line no-param-reassign
    tokenizer.getContext = this.getContext as () => TokenizerContext

    // Register into this.*Hooks.
    const registerIntoHooks = (
      hooks: Tokenizer[],
      flag: keyof TokenizerHookPhaseFlags,
    ): void => {
      if (lifecycleHookFlags[flag] === false) return
      const index = hooks.findIndex(x => x.priority < hook.priority)
      if (index < 0 || index >= hooks.length) hooks.push(hook)
      else hooks.splice(index, 0, hook)
    }

    // match-block phase
    if (hook.eatOpener != null) {
      registerIntoHooks(this.matchBlockHooks, 'match-block')
    }

    // post-match-block phase
    if (hook.transformMatch != null) {
      registerIntoHooks(this.postMatchBlockHooks, 'post-match-block')
    }

    // match-inline phase
    if (hook.findDelimiter != null) {
      hook.isDelimiterPair =
        hook.isDelimiterPair == null
          ? () => ({ paired: true })
          : hook.isDelimiterPair
      hook.processDelimiterPair =
        hook.processDelimiterPair == null
          ? (openerDelimiter, closerDelimiter, innerTokens) => ({
              token: innerTokens,
            })
          : hook.processDelimiterPair.bind(hook)
      hook.processFullDelimiter =
        hook.processFullDelimiter == null
          ? () => null
          : hook.processFullDelimiter.bind(hook)

      registerIntoHooks(this.matchInlineHooks, 'match-inline')
    }
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public unmountTokenizer(tokenizerOrName: Tokenizer | string): this {
    const tokenizerName =
      typeof tokenizerOrName === 'string'
        ? tokenizerOrName
        : tokenizerOrName.name

    const existed: boolean = this.tokenizerHookMap.delete(tokenizerName)
    if (!existed) return this

    // Check if its blockFallbackTokenizer
    if (
      this.blockFallbackTokenizer == null ||
      this.blockFallbackTokenizer.name === tokenizerName
    ) {
      this.blockFallbackTokenizer = null
    }

    // Check if it is inlineFallbackTokenizer
    else if (
      this.inlineFallbackTokenizer == null ||
      this.inlineFallbackTokenizer.name === tokenizerName
    ) {
      this.inlineFallbackTokenizer = null
    }

    // Unmount from hooks.
    const unmountFromHooks = (hooks: Tokenizer[]): void => {
      const hookIndex = hooks.findIndex(hook => hook.name === tokenizerName)
      if (hookIndex >= 0) hooks.splice(hookIndex, 1)
    }

    unmountFromHooks(this.matchBlockHooks)
    unmountFromHooks(this.postMatchBlockHooks)
    unmountFromHooks(this.matchInlineHooks)
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public useBlockFallbackTokenizer(
    blockFallbackTokenizer: BlockFallbackTokenizer,
  ): this {
    // Unmount old fallback tokenizer
    if (this.blockFallbackTokenizer != null) {
      this.unmountTokenizer(this.blockFallbackTokenizer)
    }

    // register fallback tokenizer
    this.useTokenizer(blockFallbackTokenizer, {
      'match-block': false,
      'post-match-block': false,
      'match-inline': false,
    })

    this.blockFallbackTokenizer = blockFallbackTokenizer
    return this
  }

  /**
   * @override
   * @see YastParser
   */
  public useInlineFallbackTokenizer(
    inlineFallbackTokenizer: InlineFallbackTokenizer,
  ): this {
    // Unmount old fallback tokenizer
    if (this.inlineFallbackTokenizer != null) {
      this.unmountTokenizer(this.inlineFallbackTokenizer)
    }

    // register fallback tokenizer
    this.useTokenizer(inlineFallbackTokenizer, {
      'match-block': false,
      'post-match-block': false,
      'match-inline': false,
    })

    this.inlineFallbackTokenizer = inlineFallbackTokenizer
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
    shouldReservePosition: boolean = this.defaultShouldReservePosition,
  ): Root {
    const result: Root = {
      type: 'root',
      meta: {
        definitions: {},
        footnoteDefinitions: {},
      },
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
      Math.max(0, _startIndex == null ? 0 : _startIndex),
    )
    const endIndex = Math.min(
      nodePoints.length,
      Math.max(0, _endIndex == null ? nodePoints.length : _endIndex),
    )

    // Optimization: directly return when there are no non-blank characters
    if (startIndex >= endIndex) return result

    const matchStateTree = this.matchBlock(nodePoints, startIndex, endIndex)
    const postMatchStateTree = this.postMatchBlock(matchStateTree)
    const tree = this.parseBlock(postMatchStateTree, shouldReservePosition)

    const { children } = this.deepParse(
      tree,
      tree.meta,
      shouldReservePosition,
    ) as YastParent
    result.meta = tree.meta
    result.children = children as YastNode[]
    if (this.defaultShouldReservePosition) result.position = tree.position
    return result
  }

  /**
   * Parse phrasingContent to inlines.
   *
   * @param o     current data node
   * @param meta  metadata of Yast
   * @param shouldReservePosition
   */
  protected deepParse(
    o: YastNode & YastParent,
    meta: Readonly<Meta>,
    shouldReservePosition: boolean,
  ): YastNode {
    if (o.children == null || o.children.length <= 0) return o

    const children: YastNode[] = []
    for (const u of o.children) {
      if (u.type === PhrasingContentType) {
        const phrasingContent = u as PhrasingContent
        const nodePoints: ReadonlyArray<NodePoint> = phrasingContent.contents
        const inlineStateTree = this.matchInline(
          0,
          nodePoints.length,
          nodePoints,
          meta,
        )
        const parsePhaseMetaTree = this.parseInline(
          inlineStateTree,
          nodePoints,
          meta,
          shouldReservePosition,
        )
        children.push(...parsePhaseMetaTree)
      } else {
        const v = this.deepParse(
          u as YastNode & YastParent,
          meta,
          shouldReservePosition,
        )
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
  ): YastBlockTokenTree {
    const processor = createBlockContentProcessor(
      this.getContext() as TokenizerContext,
      this.matchBlockHooks,
      this.blockFallbackTokenizer,
    )

    for (
      let lineNo = 1, startIndexOfLine = startIndex, endIndexOfLine: number;
      startIndexOfLine < endIndex;
      lineNo += 1, startIndexOfLine = endIndexOfLine
    ) {
      // find the index of the end of current line
      for (
        endIndexOfLine = startIndexOfLine;
        endIndexOfLine < endIndex;
        ++endIndexOfLine
      ) {
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
  protected postMatchBlock(tokenTree: YastBlockTokenTree): YastBlockTokenTree {
    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (o: YastBlockToken): YastBlockToken => {
      const result: YastBlockToken = { ...o }
      if (o.children != null && o.children.length > 0) {
        // Post-order handle: Perform TokenizerPostMatchBlockHook
        let tokens = o.children.map(handle)
        for (const hook of this.postMatchBlockHooks) {
          tokens = hook.transformMatch(tokens)
        }
        result.children = tokens
      }
      return result
    }

    const root: YastBlockTokenTree = handle(tokenTree) as YastBlockTokenTree
    return root
  }

  /**
   * parse-block phase.
   * @param nodePoints
   * @param tokenTree
   * @param shouldReservePosition
   */
  protected parseBlock(
    tokenTree: YastBlockTokenTree,
    shouldReservePosition: boolean,
  ): Root<Meta> {
    /**
     * Parse YastBlockToken list to YastNode list in post-order traverse.
     * @param tokens
     */
    const parseTokens = (tokens: YastBlockToken[]): YastNode[] => {
      const results: YastNode[] = []
      for (const token of tokens) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.tokenizerHookMap.get(token._tokenizer)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[parseBlock] tokenizer '${token._tokenizer}' not found`,
        )

        // Post-order handle: Prioritize child nodes
        const children: YastNode[] | undefined =
          token.children != null ? parseTokens(token.children) : undefined

        // Post-order handle: Perform TokenizerParseBlockHook
        const resultOfParse = hook.parseBlock(token, children)
        if (resultOfParse == null) continue

        const node = resultOfParse
        if (shouldReservePosition) node.position = token.position
        results.push(node)
      }
      return results
    }

    // Classify nodes.
    const children: YastNode[] = parseTokens(tokenTree.children)

    const meta: RootMeta = {
      definitions: {},
      footnoteDefinitions: {},
    }

    const tree: Root<Meta> = {
      type: 'root',
      meta: meta as Meta,
      children,
    }

    // Calc definitions
    meta.definitions = calcDefinitions(tree)

    if (shouldReservePosition) tree.position = tokenTree.position
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
  ): YastInlineToken[] {
    const processor = createPhrasingContentProcessor(this.matchInlineHooks)
    processor.process(startIndexOfBlock, endIndexOfBlock, nodePoints, meta)

    const tokensStack: YastInlineToken[] = processor.done()
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
    matchPhaseTokens: YastInlineToken[],
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
    shouldReservePosition: boolean,
  ): YastNode[] {
    const handle = (tokens: YastInlineToken[]): YastNode[] => {
      const results: YastNode[] = []
      for (const o of tokens) {
        // Post-order handle: But first check the validity of the current node
        const hook = this.tokenizerHookMap.get(o._tokenizer)

        // cannot find matched tokenizer
        invariant(
          hook != null,
          `[parseInline] tokenizer '${o._tokenizer}' not existed`,
        )

        const children: YastNode[] | undefined =
          o.children != null ? handle(o.children) : undefined
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
  protected buildPhrasingContentToken(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentToken | null {
    return this.phrasingContentTokenizer.buildBlockToken(lines)
  }

  /**
   * @override
   * @see TokenizerContext
   */
  protected buildPhrasingContent(
    token: Readonly<PhrasingContentToken>,
  ): PhrasingContent | null {
    return buildPhrasingContent(token.lines)
  }

  /**
   * @override
   * @see TokenizerContext
   */
  protected buildBlockToken(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalToken: Readonly<YastBlockToken>,
  ): YastBlockToken | null {
    const tokenizer = this.tokenizerHookMap.get(
      originalToken._tokenizer,
    ) as TokenizerMatchBlockHook
    if (tokenizer == null || tokenizer.buildBlockToken == null) return null
    return tokenizer.buildBlockToken(lines, originalToken)
  }

  /**
   * @override
   * @see TokenizerContext
   */
  protected extractPhrasingContentLines(
    originalToken: Readonly<YastBlockToken>,
  ): ReadonlyArray<PhrasingContentLine> | null {
    const tokenizer = this.tokenizerHookMap.get(
      originalToken._tokenizer,
    ) as TokenizerMatchBlockHook

    // no tokenizer for `Token.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentLines == null) return null
    return tokenizer.extractPhrasingContentLines(originalToken)
  }

  /**
   * @override
   * @see TokenizerContext
   */
  public resolveFallbackTokens(
    tokens: ReadonlyArray<YastInlineToken>,
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): YastInlineToken[] {
    if (this.inlineFallbackTokenizer == null) return tokens.slice()

    const results: YastInlineToken[] = []

    let i = startIndex
    for (const token of tokens) {
      if (i < token.startIndex) {
        const fallbackToken = this.inlineFallbackTokenizer.findAndHandleDelimiter(
          i,
          token.startIndex,
          nodePoints,
          meta,
        )
        fallbackToken._tokenizer = this.inlineFallbackTokenizer.name
        results.push(fallbackToken as YastInlineToken)
      }
      results.push(token)
      i = token.endIndex
    }

    if (i < endIndex) {
      const fallbackToken = this.inlineFallbackTokenizer.findAndHandleDelimiter(
        i,
        endIndex,
        nodePoints,
        meta,
      )
      fallbackToken._tokenizer = this.inlineFallbackTokenizer.name
      results.push(fallbackToken as YastInlineToken)
    }
    return results
  }

  /**
   * Create immutable BlockTokenizerContext getter
   */
  protected createImmutableContext(): () => TokenizerContext<Meta> {
    const context: TokenizerContext<Meta> = Object.freeze({
      buildPhrasingContentToken: this.buildPhrasingContentToken.bind(this),
      buildPhrasingContent: this.buildPhrasingContent.bind(this),
      buildBlockToken: this.buildBlockToken.bind(this),
      extractPhrasingContentLines: this.extractPhrasingContentLines.bind(this),
      resolveFallbackTokens: this.resolveFallbackTokens.bind(this),
    })

    // Return a new shallow copy each time to prevent accidental modification
    return () => context
  }
}
