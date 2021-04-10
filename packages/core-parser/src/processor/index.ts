import type { Root, RootMeta, YastNode } from '@yozora/ast'
import { calcDefinitions, replaceAST } from '@yozora/ast-util'
import type { NodePoint } from '@yozora/character'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentToken,
  TokenizerMatchBlockHook,
  YastBlockToken,
  YastInlineToken,
} from '@yozora/core-tokenizer'
import {
  PhrasingContentType,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import invariant from 'tiny-invariant'
import type { YastBlockTokenTree } from '../types'
import { createBlockContentProcessor } from './block'
import { createPhrasingContentProcessor } from './inline'
import type { Processor, ProcessorApis, ProcessorOptions } from './types'
/**
 *
 * @param options
 */
export function createProcessor(options: ProcessorOptions): Processor {
  const {
    tokenizerHookMap,
    matchBlockHooks,
    postMatchBlockHooks,
    matchInlineHooks,
    phrasingContentTokenizer,
    blockFallbackTokenizer,
    inlineFallbackTokenizer,
    shouldReservePosition,
  } = options

  const meta: RootMeta = {
    definitions: {},
    footnoteDefinitions: {},
  }
  const tree: Root = {
    type: 'root',
    meta: meta,
    children: [],
  }

  const apis: ProcessorApis = Object.freeze({
    matchBlockApi: {
      extractPhrasingLines,
      buildPhrasingContentToken,
      rollbackPhrasingLines,
    },
    postMatchBlockApi: {
      extractPhrasingLines,
      buildPhrasingContentToken,
      rollbackPhrasingLines,
    },
    parseBlockApi: {
      buildPhrasingContentToken,
      parseBlockTokens,
    },
    matchInlineApi: {
      getDefinition: identifier => meta.definitions[identifier],
      resolveFallbackTokens: resolveFallbackInlineTokens,
    },
    parseInlineApi: {
      getDefinition: identifier => meta.definitions[identifier],
    },
  })

  return { process }

  /**
   * Parse phrasing lines into Yozora AST Root.
   * @param lines
   * @returns
   */
  function process(lines: Iterable<ReadonlyArray<PhrasingContentLine>>): Root {
    let blockTokenTree = matchBlockTokens(lines)
    blockTokenTree = postMatchBlockTokens(blockTokenTree)
    const blockNodes = parseBlockTokens(blockTokenTree.children)

    tree.children = blockNodes
    tree.position = blockTokenTree.position
    meta.definitions = calcDefinitions(tree)

    replaceAST(tree, [PhrasingContentType], (node): YastNode[] | void => {
      const phrasingContent = node as PhrasingContent
      const nodePoints: ReadonlyArray<NodePoint> = phrasingContent.contents
      const inlineTokens = matchInlineTokens(nodePoints, 0, nodePoints.length)
      const inlineNodes = parseInline(nodePoints, inlineTokens)
      return inlineNodes
    })
    return tree
  }

  /**
   *
   * @param token
   */
  function extractPhrasingLines(
    token: YastBlockToken,
  ): ReadonlyArray<PhrasingContentLine> | null {
    const tokenizer = tokenizerHookMap.get(
      token._tokenizer,
    ) as TokenizerMatchBlockHook

    // no tokenizer for `Token.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentLines == null) return null
    return tokenizer.extractPhrasingContentLines(token)
  }

  /**
   * Build PhrasingContentToken from phrasing content lines.
   * @param lines
   */
  function buildPhrasingContentToken(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContentToken | null {
    return phrasingContentTokenizer.buildBlockToken(lines)
  }

  /**
   * Re-match token from phrasing content lines.
   * @param lines
   * @param originalToken
   * @returns
   */
  function rollbackPhrasingLines(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalToken: Readonly<YastBlockToken>,
  ): YastBlockToken[] {
    // Try to rematch through the original tokenizer.
    const tokenizer = tokenizerHookMap.get(
      originalToken._tokenizer,
    ) as TokenizerMatchBlockHook
    if (tokenizer != null && tokenizer.buildBlockToken != null) {
      const token = tokenizer.buildBlockToken(lines, originalToken)
      if (token != null) return [token]
    }

    // Try to rematch from the beginning
    const tree = matchBlockTokens([lines])
    return tree.children
  }

  /**
   * Resolve fallback inline tokens
   */
  function resolveFallbackInlineTokens(
    tokens: ReadonlyArray<YastInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
  ): YastInlineToken[] {
    if (inlineFallbackTokenizer == null) return tokens.slice()

    const results: YastInlineToken[] = []

    let i = tokenStartIndex
    for (const token of tokens) {
      if (i < token.startIndex) {
        const fallbackToken = inlineFallbackTokenizer.findAndHandleDelimiter(
          i,
          token.startIndex,
          nodePoints,
          apis.matchInlineApi,
        )
        fallbackToken._tokenizer = inlineFallbackTokenizer.name
        results.push(fallbackToken as YastInlineToken)
      }
      results.push(token)
      i = token.endIndex
    }

    if (i < tokenEndIndex) {
      const fallbackToken = inlineFallbackTokenizer.findAndHandleDelimiter(
        i,
        tokenEndIndex,
        nodePoints,
        apis.matchInlineApi,
      )
      fallbackToken._tokenizer = inlineFallbackTokenizer.name
      results.push(fallbackToken as YastInlineToken)
    }
    return results
  }

  /**
   * match-block phase.
   */
  function matchBlockTokens(
    linesIterator: Iterable<ReadonlyArray<PhrasingContentLine>>,
  ): YastBlockTokenTree {
    const processor = createBlockContentProcessor(
      apis.matchBlockApi,
      matchBlockHooks,
      blockFallbackTokenizer,
    )

    for (const lines of linesIterator) {
      for (const line of lines) {
        processor.consume(line)
      }
    }

    const root = processor.done()
    return root
  }

  /**
   * post-match-block phase.
   */
  function postMatchBlockTokens(
    tokenTree: YastBlockTokenTree,
  ): YastBlockTokenTree {
    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (token: YastBlockToken): YastBlockToken => {
      const result: YastBlockToken = { ...token }
      if (token.children != null && token.children.length > 0) {
        // Post-order handle: Perform TokenizerPostMatchBlockHook
        let tokens = token.children.map(handle)
        for (const hook of postMatchBlockHooks) {
          tokens = hook.transformMatch(tokens, apis.postMatchBlockApi)
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
   */
  function parseBlockTokens(tokens: YastBlockToken[]): YastNode[] {
    const results: YastNode[] = []
    for (const token of tokens) {
      // Post-order handle: But first check the validity of the current node
      const hook = tokenizerHookMap.get(token._tokenizer)

      // cannot find matched tokenizer
      invariant(
        hook != null,
        `[parseBlock] tokenizer '${token._tokenizer}' not found`,
      )

      // Post-order handle: Prioritize child nodes
      const children: YastNode[] | undefined =
        token.children != null ? parseBlockTokens(token.children) : undefined

      // Post-order handle: Perform TokenizerParseBlockHook
      const resultOfParse = hook.parseBlock(token, children, apis.parseBlockApi)
      if (resultOfParse == null) continue

      const node = resultOfParse
      if (shouldReservePosition) node.position = token.position
      results.push(node)
    }
    return results
  }

  /**
   * match-inline phase.
   */
  function matchInlineTokens(
    nodePoints: ReadonlyArray<NodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ): YastInlineToken[] {
    const processor = createPhrasingContentProcessor(matchInlineHooks)
    processor.process(
      startIndexOfBlock,
      endIndexOfBlock,
      nodePoints,
      apis.matchInlineApi,
    )

    const tokensStack: YastInlineToken[] = processor.done()
    const tokens: YastInlineToken[] = resolveFallbackInlineTokens(
      tokensStack,
      startIndexOfBlock,
      endIndexOfBlock,
      nodePoints,
    )
    return tokens
  }

  /**
   * parse-inline phase.
   */
  function parseInline(
    nodePoints: ReadonlyArray<NodePoint>,
    tokens: YastInlineToken[],
  ): YastNode[] {
    const results: YastNode[] = []
    for (const o of tokens) {
      // Post-order handle: But first check the validity of the current node
      const hook = tokenizerHookMap.get(o._tokenizer)

      // cannot find matched tokenizer
      invariant(
        hook != null,
        `[parseInline] tokenizer '${o._tokenizer}' not existed`,
      )

      const children: YastNode[] | undefined =
        o.children != null ? parseInline(nodePoints, o.children) : undefined

      const node = hook.processToken(
        o,
        children,
        nodePoints,
        apis.parseInlineApi,
      )

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
}
