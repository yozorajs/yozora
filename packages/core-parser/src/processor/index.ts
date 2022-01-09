import type { IRoot, IYastNode } from '@yozora/ast'
import { removePositions, shallowMutateAstInPreorder } from '@yozora/ast-util'
import type { INodePoint } from '@yozora/character'
import type {
  IParseBlockHook,
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
      parseInlineTokens,
      calcPosition: token => ({
        start: calcStartYastNodePoint(_nodePoints, token.startIndex),
        end: calcEndYastNodePoint(_nodePoints, token.endIndex - 1),
      }),
    },
  })

  const matchBlockHooks: ReadonlyArray<IMatchBlockPhaseHook> = blockTokenizers.map(tokenizer => ({
    ...tokenizer.match(apis.matchBlockApi),
    name: tokenizer.name,
    priority: tokenizer.priority,
  }))
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
    const blockTokenTree = matchBlockTokens(lines)
    isIdentifierRegisterAvailable = false // Close registration.

    // Solve reference identifiers.
    for (const definition of presetDefinitions) {
      definitionIdentifierSet.add(definition.identifier)
    }
    for (const footnoteDefinition of presetFootnoteDefinitions) {
      footnoteIdentifierSet.add(footnoteDefinition.identifier)
    }

    const blockNodes = parseBlockTokens(blockTokenTree.children)

    // Resolve phrasingContents into Yozora AST nodes.
    const ast: IRoot = shallowMutateAstInPreorder(
      {
        type: 'root',
        position: blockTokenTree.position,
        children: blockNodes,
      },
      [PhrasingContentType],
      (node): IYastNode[] => parsePhrasingContent(node as IPhrasingContent),
    )

    if (!shouldReservePosition) removePositions(ast)
    return ast
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
    const inlineNodes = parseInlineTokens(inlineTokens)
    return inlineNodes
  }

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

  function parseBlockTokens(tokens?: ReadonlyArray<IYastBlockToken>): IYastNode[] {
    if (tokens === undefined || tokens.length <= 0) return []

    const results: IYastNode[] = []
    for (let i0 = 0, i1: number; i0 < tokens.length; i0 = i1) {
      const _tokenizer: string = tokens[i0]._tokenizer
      for (i1 = i0 + 1; i1 < tokens.length && tokens[i1]._tokenizer === _tokenizer; ) i1 += 1

      const hook = parseBlockHookMap.get(_tokenizer)

      // cannot find matched tokenizer
      invariant(hook !== undefined, `[parseBlock] tokenizer '${_tokenizer}' not found`)

      const nodes: IYastNode[] = hook.parse(tokens.slice(i0, i1))
      results.push(...nodes)
    }
    return results
  }

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

  function parseInlineTokens(tokens?: ReadonlyArray<IYastInlineToken>): IYastNode[] {
    if (tokens === undefined || tokens.length <= 0) return []

    const results: IYastNode[] = []
    for (let i0 = 0, i1: number; i0 < tokens.length; i0 = i1) {
      const _tokenizer: string = tokens[i0]._tokenizer
      for (i1 = i0 + 1; i1 < tokens.length && tokens[i1]._tokenizer === _tokenizer; ) i1 += 1

      const hook = parseInlineHookMap.get(_tokenizer)

      // cannot find matched tokenizer
      invariant(hook !== undefined, `[parseBlock] tokenizer '${_tokenizer}' not found`)

      const nodes: IYastNode[] = hook.parse(tokens.slice(i0, i1))
      results.push(...nodes)
    }
    return results
  }
}
