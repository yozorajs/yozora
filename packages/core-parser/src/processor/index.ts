import type { Root, YastNode } from '@yozora/ast'
import {
  mergePresetIdentifiers,
  shallowMutateAstInPreorder,
} from '@yozora/ast-util'
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
import invariant from '@yozora/invariant'
import type { YastBlockTokenTree } from '../types'
import { createBlockContentProcessor } from './block'
import {
  createPhrasingContentProcessor,
  createProcessorHookGroups,
} from './inline'
import type { DelimiterProcessorHook } from './inline/types'
import type { Processor, ProcessorApis, ProcessorOptions } from './types'

/**
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
    presetDefinitions,
    presetFootnoteDefinitions,
  } = options

  let isIdentifierRegisterOpening = false
  let definitions: Record<string, true>
  let footnoteDefinitions: Record<string, true>

  let _nodePoints: ReadonlyArray<NodePoint> = []
  let _blockStartIndex = -1
  let _blockEndIndex = -1
  const apis: ProcessorApis = Object.freeze({
    matchBlockApi: {
      extractPhrasingLines,
      buildPhrasingContentToken,
      rollbackPhrasingLines,
      registerDefinitionIdentifier: (identifier: string): void => {
        if (isIdentifierRegisterOpening) definitions[identifier] = true
      },
      registerFootnoteDefinitionIdentifier: (identifier: string): void => {
        if (isIdentifierRegisterOpening) footnoteDefinitions[identifier] = true
      },
    },
    postMatchBlockApi: {
      extractPhrasingLines,
      buildPhrasingContentToken,
      rollbackPhrasingLines,
    },
    parseBlockApi: {
      buildPhrasingContent,
      parsePhrasingContent,
      parseBlockTokens,
    },
    matchInlineApi: {
      hasDefinition: identifier => Boolean(definitions[identifier]),
      hasFootnoteDefinition: identifier =>
        Boolean(footnoteDefinitions[identifier]),
      getNodePoints: () => _nodePoints,
      getBlockStartIndex: () => _blockStartIndex,
      getBlockEndIndex: () => _blockEndIndex,
      resolveFallbackTokens,
    },
    parseInlineApi: {
      getNodePoints: () => _nodePoints,
      hasDefinition: identifier => Boolean(definitions[identifier]),
      hasFootnoteDefinition: identifier =>
        Boolean(footnoteDefinitions[identifier]),
    },
  })

  // match-inline hook groups.
  const matchInlineHookGroups: ReadonlyArray<
    ReadonlyArray<DelimiterProcessorHook>
  > = createProcessorHookGroups(
    matchInlineHooks,
    apis.matchInlineApi,
    resolveFallbackTokens,
  )
  const phrasingContentProcessor = createPhrasingContentProcessor(
    matchInlineHookGroups,
    0,
  )

  return { process }

  /**
   * Parse phrasing lines into Yozora AST Root.
   * @param lines
   * @returns
   */
  function process(lines: Iterable<ReadonlyArray<PhrasingContentLine>>): Root {
    definitions = {}
    footnoteDefinitions = {}

    isIdentifierRegisterOpening = true // Open registration.
    let blockTokenTree = matchBlockTokens(lines)
    blockTokenTree = postMatchBlockTokens(blockTokenTree)
    isIdentifierRegisterOpening = false // Close registration.

    // Solve reference identifiers.
    mergePresetIdentifiers(definitions, presetDefinitions)
    mergePresetIdentifiers(footnoteDefinitions, presetFootnoteDefinitions)

    const blockNodes = parseBlockTokens(blockTokenTree.children)

    const tree: Root = { type: 'root', children: blockNodes }
    if (shouldReservePosition) tree.position = blockTokenTree.position

    // Resolve phrasingContents into Yozora AST nodes.
    const result: Root = shallowMutateAstInPreorder(
      tree,
      [PhrasingContentType],
      (node): YastNode[] => parsePhrasingContent(node as PhrasingContent),
    )
    return result
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
   * Build PhrasingContent from a PhrasingContentToken.
   * @param lines
   * @returns
   */
  function buildPhrasingContent(
    lines: ReadonlyArray<PhrasingContentLine>,
  ): PhrasingContent | null {
    return phrasingContentTokenizer.buildPhrasingContent(lines)
  }

  /**
   * Re-match token from phrasing content lines.
   * @param lines
   * @param originalToken
   * @returns
   */
  function rollbackPhrasingLines(
    lines: ReadonlyArray<PhrasingContentLine>,
    originalToken?: Readonly<YastBlockToken>,
  ): YastBlockToken[] {
    if (originalToken != null) {
      // Try to rematch through the original tokenizer.
      const tokenizer = tokenizerHookMap.get(
        originalToken._tokenizer,
      ) as TokenizerMatchBlockHook
      if (tokenizer != null && tokenizer.buildBlockToken != null) {
        const token = tokenizer.buildBlockToken(lines, originalToken)
        if (token != null) return [token]
      }
    }

    // Try to rematch from the beginning
    const tokenTree = matchBlockTokens([lines])
    return tokenTree.children
  }

  /**
   * Parse phrasing content to Yozora AST nodes.
   * @param phrasingContent
   * @returns
   */
  function parsePhrasingContent(phrasingContent: PhrasingContent): YastNode[] {
    const nodePoints: ReadonlyArray<NodePoint> = phrasingContent.contents
    const inlineTokens = matchInlineTokens(nodePoints, 0, nodePoints.length)
    const inlineNodes = parseInline(inlineTokens)
    return inlineNodes
  }

  /**
   * Resolve fallback inline tokens
   */
  function resolveFallbackTokens(
    tokens: ReadonlyArray<YastInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
  ): ReadonlyArray<YastInlineToken> {
    if (inlineFallbackTokenizer == null) return tokens

    let i = tokenStartIndex
    const results: YastInlineToken[] = []
    for (const token of tokens) {
      if (i < token.startIndex) {
        const fallbackToken = inlineFallbackTokenizer.findAndHandleDelimiter(
          i,
          token.startIndex,
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
      const children: YastNode[] =
        token.children != null ? parseBlockTokens(token.children) : []

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
  ): ReadonlyArray<YastInlineToken> {
    _nodePoints = nodePoints
    _blockStartIndex = startIndexOfBlock
    _blockEndIndex = endIndexOfBlock

    const tokensStack: ReadonlyArray<YastInlineToken> =
      phrasingContentProcessor.process([], startIndexOfBlock, endIndexOfBlock)

    const tokens: ReadonlyArray<YastInlineToken> = resolveFallbackTokens(
      tokensStack,
      startIndexOfBlock,
      endIndexOfBlock,
    )
    return tokens
  }

  /**
   * parse-inline phase.
   */
  function parseInline(tokens: ReadonlyArray<YastInlineToken>): YastNode[] {
    const results: YastNode[] = []
    for (const o of tokens) {
      // Post-order handle: But first check the validity of the current node
      const hook = tokenizerHookMap.get(o._tokenizer)

      // cannot find matched tokenizer
      invariant(
        hook != null,
        `[parseInline] tokenizer '${o._tokenizer}' not existed`,
      )

      const children: YastNode[] =
        o.children != null ? parseInline(o.children) : []

      const node = hook.parseInline(o, children, apis.parseInlineApi)

      if (shouldReservePosition) {
        node.position = {
          start: calcStartYastNodePoint(_nodePoints, o.startIndex),
          end: calcEndYastNodePoint(_nodePoints, o.endIndex - 1),
        }
      }
      results.push(node)
    }
    return results
  }
}
