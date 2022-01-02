import type { IRoot, IYastNode } from '@yozora/ast'
import { shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { INodePoint } from '@yozora/character'
import type {
  IMatchBlockHook,
  IParseInlineHook,
  IPhrasingContent,
  IPhrasingContentLine,
  IPhrasingContentToken,
  IYastBlockToken,
  IYastInlineToken,
} from '@yozora/core-tokenizer'
import {
  PhrasingContentType,
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import invariant from '@yozora/invariant'
import type { IYastBlockTokenTree } from '../types'
import { createBlockContentProcessor } from './block'
import { createPhrasingContentProcessor, createProcessorHookGroups } from './inline'
import type { IDelimiterProcessorHook } from './inline/types'
import type { IProcessor, IProcessorApis, IProcessorOptions } from './types'

/**
 * @param options
 */
export function createProcessor(options: IProcessorOptions): IProcessor {
  const {
    tokenizerHookMap,
    matchBlockHooks,
    postMatchBlockHooks,
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

  // match-inline hook groups.
  const matchInlineHookGroups: ReadonlyArray<ReadonlyArray<IDelimiterProcessorHook>> =
    createProcessorHookGroups(options.inlineTokenizers, apis.matchInlineApi, resolveFallbackTokens)
  const parseInlineHookMap = new Map<string, IParseInlineHook>(
    Array.from(options.inlineTokenizerMap.entries()).map(entry => [
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
    const tokenizer = tokenizerHookMap.get(token._tokenizer) as IMatchBlockHook

    // no tokenizer for `IToken.type` found
    if (tokenizer == null) return null

    if (tokenizer.extractPhrasingContentLines == null) return null
    return tokenizer.extractPhrasingContentLines(token)
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
    return phrasingContentTokenizer.buildPhrasingContent(lines)
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
      const tokenizer = tokenizerHookMap.get(originalToken._tokenizer) as IMatchBlockHook
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
          tokens = hook.transformMatch(tokens, apis.postMatchBlockApi)
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
      const hook = tokenizerHookMap.get(token._tokenizer)

      // cannot find matched tokenizer
      invariant(hook != null, `[parseBlock] tokenizer '${token._tokenizer}' not found`)

      // Post-order handle: Prioritize child nodes
      const children: IYastNode[] = token.children != null ? parseBlockTokens(token.children) : []

      // Post-order handle: Perform IParseBlockHook
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
