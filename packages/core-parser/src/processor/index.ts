import type { Node, Root } from '@yozora/ast'
import type { INodePoint } from '@yozora/character'
import type {
  IBlockToken,
  IInlineToken,
  IParseBlockHook,
  IParseInlineHook,
  IPhrasingContentLine,
} from '@yozora/core-tokenizer'
import { calcEndPoint, calcStartPoint } from '@yozora/core-tokenizer'
import invariant from '@yozora/invariant'
import { createBlockContentProcessor } from './block'
import type { IBlockTokenTree, IMatchBlockPhaseHook } from './block/types'
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
    blockFallbackTokenizer,
    inlineFallbackTokenizer,
    shouldReservePosition,
    presetDefinitions,
    presetFootnoteDefinitions,
    formatUrl,
  } = options

  let isIdentifierRegisterAvailable = false
  const definitionIdentifierSet: Set<string> = new Set<string>()
  const footnoteIdentifierSet: Set<string> = new Set<string>()

  let _nodePoints: ReadonlyArray<INodePoint> = []
  let _blockStartIndex = -1
  let _blockEndIndex = -1
  const apis: IProcessorApis = Object.freeze<IProcessorApis>({
    matchBlockApi: {
      extractPhrasingLines,
      rollbackPhrasingLines,
      registerDefinitionIdentifier: (identifier: string): void => {
        if (isIdentifierRegisterAvailable) definitionIdentifierSet.add(identifier)
      },
      registerFootnoteDefinitionIdentifier: (identifier: string): void => {
        if (isIdentifierRegisterAvailable) footnoteIdentifierSet.add(identifier)
      },
    },
    parseBlockApi: {
      shouldReservePosition,
      formatUrl,
      processInlines,
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
      shouldReservePosition,
      calcPosition: token => ({
        start: calcStartPoint(_nodePoints, token.startIndex),
        end: calcEndPoint(_nodePoints, token.endIndex - 1),
      }),
      formatUrl,
      getNodePoints: () => _nodePoints,
      hasDefinition: identifier => definitionIdentifierSet.has(identifier),
      hasFootnoteDefinition: identifier => footnoteIdentifierSet.has(identifier),
      parseInlineTokens,
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
  function process(lines: Iterable<ReadonlyArray<IPhrasingContentLine>>): Root {
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

    const children: Node[] = parseBlockTokens(blockTokenTree.children)
    const ast: Root = shouldReservePosition
      ? { type: 'root', position: blockTokenTree.position, children }
      : { type: 'root', children }
    return ast
  }

  function extractPhrasingLines(token: IBlockToken): ReadonlyArray<IPhrasingContentLine> | null {
    const tokenizer = blockTokenizerMap.get(token._tokenizer)
    return tokenizer?.extractPhrasingContentLines(token) ?? null
  }

  /**
   * Re-match token from phrasing content lines.
   * @param lines
   * @param originalToken
   * @returns
   */
  function rollbackPhrasingLines(
    lines: ReadonlyArray<IPhrasingContentLine>,
    originalToken?: Readonly<IBlockToken>,
  ): IBlockToken[] {
    if (originalToken != null) {
      // Try to rematch through the original tokenizer.
      const tokenizer = blockTokenizerMap.get(originalToken._tokenizer)
      if (tokenizer !== undefined && tokenizer.buildBlockToken != null) {
        const token = tokenizer.buildBlockToken(lines, originalToken)
        if (token !== null) {
          token._tokenizer = tokenizer.name
          return [token as IBlockToken]
        }
      }
    }

    // Try to rematch from the beginning
    const tokenTree = matchBlockTokens([lines])
    return tokenTree.children
  }

  function resolveFallbackTokens(
    tokens: ReadonlyArray<IInlineToken>,
    tokenStartIndex: number,
    tokenEndIndex: number,
  ): ReadonlyArray<IInlineToken> {
    if (inlineFallbackTokenizer == null) return tokens

    let i = tokenStartIndex
    const results: IInlineToken[] = []
    for (const token of tokens) {
      if (i < token.startIndex) {
        const fallbackToken = inlineFallbackTokenizer.findAndHandleDelimiter(
          i,
          token.startIndex,
          apis.matchInlineApi,
        )
        fallbackToken._tokenizer = inlineFallbackTokenizer.name
        results.push(fallbackToken as IInlineToken)
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
      results.push(fallbackToken as IInlineToken)
    }
    return results
  }

  function matchBlockTokens(
    linesIterator: Iterable<ReadonlyArray<IPhrasingContentLine>>,
  ): IBlockTokenTree {
    const processor = createBlockContentProcessor(matchBlockHooks, blockFallbackHook)

    for (const lines of linesIterator) {
      for (const line of lines) {
        processor.consume(line)
      }
    }

    const root = processor.done()
    return root
  }

  function parseBlockTokens(tokens?: ReadonlyArray<IBlockToken>): Node[] {
    if (tokens === undefined || tokens.length <= 0) return []

    const results: Node[] = []
    for (let i0 = 0, i1: number; i0 < tokens.length; i0 = i1) {
      const _tokenizer: string = tokens[i0]._tokenizer
      for (i1 = i0 + 1; i1 < tokens.length && tokens[i1]._tokenizer === _tokenizer; ) i1 += 1

      const hook = parseBlockHookMap.get(_tokenizer)

      // cannot find matched tokenizer
      invariant(hook !== undefined, `[parseBlock] tokenizer '${_tokenizer}' not found`)

      const nodes: Node[] = hook.parse(tokens.slice(i0, i1))
      results.push(...nodes)
    }
    return results
  }

  function processInlines(nodePoints: ReadonlyArray<INodePoint>): Node[] {
    if (nodePoints.length <= 0) return []
    const inlineTokens = matchInlineTokens(nodePoints, 0, nodePoints.length)
    const inlineNodes = parseInlineTokens(inlineTokens)
    return inlineNodes
  }

  function matchInlineTokens(
    nodePoints: ReadonlyArray<INodePoint>,
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ): ReadonlyArray<IInlineToken> {
    _nodePoints = nodePoints
    _blockStartIndex = startIndexOfBlock
    _blockEndIndex = endIndexOfBlock

    const tokensStack: ReadonlyArray<IInlineToken> = phrasingContentProcessor.process(
      [],
      startIndexOfBlock,
      endIndexOfBlock,
    )

    const tokens: ReadonlyArray<IInlineToken> = resolveFallbackTokens(
      tokensStack,
      startIndexOfBlock,
      endIndexOfBlock,
    )
    return tokens
  }

  function parseInlineTokens(tokens?: ReadonlyArray<IInlineToken>): Node[] {
    if (tokens === undefined || tokens.length <= 0) return []

    const results: Node[] = []
    for (let i0 = 0, i1: number; i0 < tokens.length; i0 = i1) {
      const _tokenizer: string = tokens[i0]._tokenizer
      for (i1 = i0 + 1; i1 < tokens.length && tokens[i1]._tokenizer === _tokenizer; ) i1 += 1

      const hook = parseInlineHookMap.get(_tokenizer)

      // cannot find matched tokenizer
      invariant(hook !== undefined, `[parseBlock] tokenizer '${_tokenizer}' not found`)

      const nodes: Node[] = hook.parse(tokens.slice(i0, i1))
      results.push(...nodes)
    }
    return results
  }
}
