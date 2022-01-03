import type { IRoot, IYastNode } from '@yozora/ast'
import { shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { INodePoint } from '@yozora/character'
import type {
  IParseBlockHook,
  IParseInlineHook,
  IPhrasingContent,
  IPhrasingContentLine,
  IPhrasingContentToken,
  IPostMatchBlockHook,
  IYastBlockToken,
  IYastInlineToken,
} from '@yozora/core-tokenizer'
import {
  PhrasingContentType,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import invariant from '@yozora/invariant'
import { createBlockContentProcessor } from './block'
import type { IMatchBlockPhaseHook, IYastBlockTokenTree } from './block/types'
import { createPhrasingContentProcessor, createProcessorHookGroups } from './inline'
import type { IDelimiterProcessorHook } from './inline/types'
import type { IProcessor, IProcessorApis, IProcessorOptions } from './types'

/**
 * @param options
 */
export function createProcessor(options: IProcessorOptions): IProcessor {
  const {
    inlineTokenizers,
    inlineTokenizerMap,
    blockTokenizers,
    blockTokenizerMap,
    phrasingContentTokenizer,
    blockFallbackTokenizer,
    inlineFallbackTokenizer,
    shouldReservePosition,
    presetDefinitions,
    presetFootnoteDefinitions,
  } = options

  let isIdentifierRegisterAvailable = false
  const definitionIdentifierSet: Set<string> = new Set<string>()
  const footnoteIdentifierSet: Set<string> = new Set<string>()

  let _nodePoints: ReadonlyArray<INodePoint> = []
  let _blockStartIndex = -1
  let _blockEndIndex = -1
  const apis: IProcessorApis = Object.freeze({
    matchBlockApi: {
      extractPhrasingLines,
      buildPhrasingContentToken,
      rollbackPhrasingLines,
      registerDefinitionIdentifier: (identifier: string): void => {
        if (isIdentifierRegisterAvailable) definitionIdentifierSet.add(identifier)
      },
      registerFootnoteDefinitionIdentifier: (identifier: string): void => {
        if (isIdentifierRegisterAvailable) footnoteIdentifierSet.add(identifier)
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
      hasDefinition: identifier => definitionIdentifierSet.has(identifier),
      hasFootnoteDefinition: identifier => footnoteIdentifierSet.has(identifier),
      getNodePoints: () => _nodePoints,
      getBlockStartIndex: () => _blockStartIndex,
      getBlockEndIndex: () => _blockEndIndex,
      resolveFallbackTokens,
    },
    parseInlineApi: {
      getNodePoints: () => _nodePoints,
      hasDefinition: identifier => definitionIdentifierSet.has(identifier),
      hasFootnoteDefinition: identifier => footnoteIdentifierSet.has(identifier),
    },
  })

  const matchBlockHooks: ReadonlyArray<IMatchBlockPhaseHook> = blockTokenizers.map(tokenizer => ({
    ...tokenizer.match(apis.matchBlockApi),
    name: tokenizer.name,
    priority: tokenizer.priority,
  }))
  const postMatchBlockHooks: ReadonlyArray<IPostMatchBlockHook> = blockTokenizers
    .filter(tokenizer => tokenizer.postMatch)
    .map(tokenizer => tokenizer.postMatch!(apis.postMatchBlockApi))
  const parseBlockHookMap = new Map<string, IParseBlockHook>(
    Array.from(blockTokenizerMap.entries()).map(entry => [
      entry[0],
      entry[1].parse(apis.parseBlockApi),
    ]),
  )
  const blockFallbackHook: IMatchBlockPhaseHook | null = blockFallbackTokenizer
    ? {
        ...blockFallbackTokenizer.match(apis.matchBlockApi),
        name: blockFallbackTokenizer.name,
        priority: blockFallbackTokenizer.priority,
      }
    : null
  const matchInlineHookGroups: ReadonlyArray<ReadonlyArray<IDelimiterProcessorHook>> =
    createProcessorHookGroups(inlineTokenizers, apis.matchInlineApi, resolveFallbackTokens)
  const parseInlineHookMap = new Map<string, IParseInlineHook>(
    Array.from(inlineTokenizerMap.entries()).map(entry => [
      entry[0],
      entry[1].parse(apis.parseInlineApi),
    ]),
  )
  const phrasingContentProcessor = createPhrasingContentProcessor(matchInlineHookGroups, 0)

  return { process }

  /**
   * Parse phrasing lines into Yozora AST Root.
   * @param lines
   * @returns
   */
  function process(lines: Iterable<ReadonlyArray<IPhrasingContentLine>>): IRoot {
    definitionIdentifierSet.clear()
    footnoteIdentifierSet.clear()

    isIdentifierRegisterAvailable = true // Open registration.
    let blockTokenTree = matchBlockTokens(lines)
    blockTokenTree = postMatchBlockTokens(blockTokenTree)
    isIdentifierRegisterAvailable = false // Close registration.

    // Solve reference identifiers.
    for (const definition of presetDefinitions) {
      definitionIdentifierSet.add(definition.identifier)
    }
    for (const footnoteDefinition of presetFootnoteDefinitions) {
      footnoteIdentifierSet.add(footnoteDefinition.identifier)
    }

    const blockNodes = parseBlockTokens(blockTokenTree.children)

    const tree: IRoot = { type: 'root', children: blockNodes }
    if (shouldReservePosition) tree.position = blockTokenTree.position

    // Resolve phrasingContents into Yozora AST nodes.
    const result: IRoot = shallowMutateAstInPreorder(
      tree,
      [PhrasingContentType],
      (node): IYastNode[] => parsePhrasingContent(node as IPhrasingContent),
    )
    return result
  }

  /**
   *
   * @param token
   */
  function extractPhrasingLines(
    token: IYastBlockToken,
  ): ReadonlyArray<IPhrasingContentLine> | null {
    const tokenizer = blockTokenizerMap.get(token._tokenizer)
    return tokenizer?.extractPhrasingContentLines(token) ?? null
  }

  /**
   * Build PhrasingContentToken from phrasing content lines.
   * @param lines
   */
  function buildPhrasingContentToken(
    lines: ReadonlyArray<IPhrasingContentLine>,
  ): IPhrasingContentToken | null {
    return phrasingContentTokenizer.buildBlockToken(lines)
  }

  /**
   * Build IPhrasingContent from a PhrasingContentToken.
   * @param lines
   * @returns
   */
  function buildPhrasingContent(
    lines: ReadonlyArray<IPhrasingContentLine>,
  ): IPhrasingContent | null {
    return blockFallbackTokenizer?.buildPhrasingContent(lines) ?? null
  }

  /**
   * Re-match token from phrasing content lines.
   * @param lines
   * @param originalToken
   * @returns
   */
  function rollbackPhrasingLines(
    lines: ReadonlyArray<IPhrasingContentLine>,
    originalToken?: Readonly<IYastBlockToken>,
  ): IYastBlockToken[] {
    if (originalToken != null) {
      // Try to rematch through the original tokenizer.
      const tokenizer = blockTokenizerMap.get(originalToken._tokenizer)
      if (tokenizer !== undefined && tokenizer.buildBlockToken != null) {
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
  function parsePhrasingContent(phrasingContent: IPhrasingContent): IYastNode[] {
    const nodePoints: ReadonlyArray<INodePoint> = phrasingContent.contents
    const inlineTokens = matchInlineTokens(nodePoints, 0, nodePoints.length)
    const inlineNodes = parseInline(inlineTokens)
    return inlineNodes
  }

  /**
   * Resolve fallback inline tokens
   */
  function resolveFallbackTokens(
    tokens: ReadonlyArray<IYastInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
  ): ReadonlyArray<IYastInlineToken> {
    if (inlineFallbackTokenizer == null) return tokens

    let i = tokenStartIndex
    const results: IYastInlineToken[] = []
    for (const token of tokens) {
      if (i < token.startIndex) {
        const fallbackToken = inlineFallbackTokenizer.findAndHandleDelimiter(
          i,
          token.startIndex,
          apis.matchInlineApi,
        )
        fallbackToken._tokenizer = inlineFallbackTokenizer.name
        results.push(fallbackToken as IYastInlineToken)
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
      results.push(fallbackToken as IYastInlineToken)
    }
    return results
  }

  /**
   * match-block phase.
   */
  function matchBlockTokens(
    linesIterator: Iterable<ReadonlyArray<IPhrasingContentLine>>,
  ): IYastBlockTokenTree {
    const processor = createBlockContentProcessor(matchBlockHooks, blockFallbackHook)

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
  function postMatchBlockTokens(tokenTree: IYastBlockTokenTree): IYastBlockTokenTree {
    /**
     * 由于 transformMatch 拥有替换原节点的能力，因此采用后序处理，
     * 防止多次进入到同一节点（替换节点可能会产生一个高阶子树，类似于 List）；
     *
     * Since transformMatch has the ability to replace the original node,
     * post-order processing is used to prevent multiple entry to the same
     * node (replacement of the node may produce a high-order subtree, similar to List)
     */
    const handle = (token: IYastBlockToken): IYastBlockToken => {
      const result: IYastBlockToken = { ...token }
      if (token.children != null && token.children.length > 0) {
        // Post-order handle: Perform IPostMatchBlockHook
        let tokens = token.children.map(handle)
        for (const hook of postMatchBlockHooks) {
          if (hook.transformMatch) {
            tokens = hook.transformMatch(tokens)
          }
        }
        result.children = tokens
      }
      return result
    }

    const root: IYastBlockTokenTree = handle(tokenTree) as IYastBlockTokenTree
    return root
  }

  /**
   * parse-block phase.
   */
  function parseBlockTokens(tokens: IYastBlockToken[]): IYastNode[] {
    const results: IYastNode[] = []
    for (const token of tokens) {
      // Post-order handle: But first check the validity of the current node
      const hook = parseBlockHookMap.get(token._tokenizer)

      // cannot find matched tokenizer
      invariant(hook !== undefined, `[parseBlock] tokenizer '${token._tokenizer}' not found`)

      // Post-order handle: Prioritize child nodes
      const children: IYastNode[] = token.children != null ? parseBlockTokens(token.children) : []

      // Post-order handle: Perform IParseBlockHook
      const resultOfParse = hook.parse(token, children)
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
    nodePoints: ReadonlyArray<INodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ): ReadonlyArray<IYastInlineToken> {
    _nodePoints = nodePoints
    _blockStartIndex = startIndexOfBlock
    _blockEndIndex = endIndexOfBlock

    const tokensStack: ReadonlyArray<IYastInlineToken> = phrasingContentProcessor.process(
      [],
      startIndexOfBlock,
      endIndexOfBlock,
    )

    const tokens: ReadonlyArray<IYastInlineToken> = resolveFallbackTokens(
      tokensStack,
      startIndexOfBlock,
      endIndexOfBlock,
    )
    return tokens
  }

  /**
   * parse-inline phase.
   */
  function parseInline(tokens: ReadonlyArray<IYastInlineToken>): IYastNode[] {
    const results: IYastNode[] = []
    for (const o of tokens) {
      // Post-order handle: But first check the validity of the current node
      const hook = parseInlineHookMap.get(o._tokenizer)

      // cannot find matched tokenizer
      invariant(hook != null, `[parseInline] tokenizer '${o._tokenizer}' not existed`)

      const children: IYastNode[] = o.children != null ? parseInline(o.children) : []
      const node = hook.parse(o, children)

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
