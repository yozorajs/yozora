import type { Node, Root } from '@yozora/ast'
import type { INodePoint, ISourcePoint } from '@yozora/character'
import type {
  IBlockToken,
  IInlineToken,
  IParseBlockHook,
  IParseBlockPhaseContext,
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

interface IParseBlockFrame {
  parentToken: IBlockToken | null
  tokenIndex: number
  tokens: readonly IBlockToken[]
}

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

  let _nodePoints: readonly INodePoint[] = []
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

  const matchBlockHooks: readonly IMatchBlockPhaseHook[] = blockTokenizers.map(tokenizer => ({
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
  const matchInlineHookGroups: readonly (readonly IDelimiterProcessorHook[])[] =
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
  function process(
    lines: Iterable<readonly IPhrasingContentLine[], ISourcePoint | undefined>,
  ): Root {
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

  function extractPhrasingLines(token: IBlockToken): readonly IPhrasingContentLine[] | null {
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
    lines: readonly IPhrasingContentLine[],
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
    tokens: readonly IInlineToken[],
    tokenStartIndex: number,
    tokenEndIndex: number,
  ): readonly IInlineToken[] {
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
    linesIterator: Iterable<readonly IPhrasingContentLine[], ISourcePoint | undefined>,
  ): IBlockTokenTree {
    const processor = createBlockContentProcessor(matchBlockHooks, blockFallbackHook)

    // A for-of loop would discard the source EOF returned by the iterator.
    const iterator = linesIterator[Symbol.iterator]()
    let result = iterator.next()
    while (!result.done) {
      const lines = result.value
      for (const line of lines) {
        processor.consume(line)
      }
      result = iterator.next()
    }

    const sourceEndPoint = result.value
    const root = processor.done()
    if (sourceEndPoint !== undefined) root.position.end = { ...sourceEndPoint }
    return root
  }

  /**
   * Parse the block token tree iteratively in post-order. This processor owns
   * traversal and child results. Cursor frames grow only with nesting depth,
   * and parsed children are retained only until their direct parent hooks
   * return. Tokenizer and cyclic-tree errors abort the current parse.
   * @param tokens
   */
  function parseBlockTokens(tokens?: readonly IBlockToken[]): Node[] {
    if (tokens === undefined || tokens.length <= 0) return []

    const parsedChildrenMap = new Map<IBlockToken, Node[]>()
    const visitingTokenSet = new Set<IBlockToken>()
    const frameStack: IParseBlockFrame[] = []
    const ctx: IParseBlockPhaseContext = {
      getChildren: token => {
        if (token.children == null || token.children.length <= 0) return []

        const children = parsedChildrenMap.get(token as IBlockToken)
        invariant(
          children !== undefined,
          `[parseBlock] children of tokenizer '${token._tokenizer}' have not been parsed`,
        )
        return children
      },
    }

    /**
     * Push a block token branch into the frame stack.
     * @param parentToken
     * @param childTokens
     */
    const push = (parentToken: IBlockToken | null, childTokens: readonly IBlockToken[]): void => {
      if (parentToken != null) {
        invariant(
          !visitingTokenSet.has(parentToken),
          `[parseBlock] cyclic token tree at tokenizer '${parentToken._tokenizer}'`,
        )
        visitingTokenSet.add(parentToken)
      }
      frameStack.push({ parentToken, tokenIndex: 0, tokens: childTokens })
    }

    /**
     * Parse and pop the top frame.
     */
    const popup = (): Node[] => {
      const frame = frameStack.pop()
      invariant(frame != null, '[parseBlock] frame stack is empty')

      const nodes = parseFlatBlockTokens(frame.tokens, ctx)

      // Parsed children are no longer needed after their parent hooks return.
      for (const token of frame.tokens) parsedChildrenMap.delete(token)

      if (frame.parentToken != null) {
        parsedChildrenMap.set(frame.parentToken, nodes)
        visitingTokenSet.delete(frame.parentToken)
      }
      return nodes
    }

    push(null, tokens)
    let nodes: Node[] = []
    while (frameStack.length > 0) {
      const frame = frameStack[frameStack.length - 1]
      if (frame.tokenIndex >= frame.tokens.length) {
        nodes = popup()
        continue
      }

      const token = frame.tokens[frame.tokenIndex]
      frame.tokenIndex += 1
      if (token.children == null || token.children.length <= 0) continue

      push(token, token.children)
    }
    return nodes
  }

  function parseFlatBlockTokens(
    tokens: readonly IBlockToken[],
    ctx: IParseBlockPhaseContext,
  ): Node[] {
    const results: Node[] = []
    for (let i0 = 0, i1: number; i0 < tokens.length; i0 = i1) {
      const _tokenizer: string = tokens[i0]._tokenizer
      for (i1 = i0 + 1; i1 < tokens.length && tokens[i1]._tokenizer === _tokenizer;) i1 += 1

      const hook = parseBlockHookMap.get(_tokenizer)

      // cannot find matched tokenizer
      invariant(hook !== undefined, `[parseBlock] tokenizer '${_tokenizer}' not found`)

      const nodes: Node[] = hook.parse(tokens.slice(i0, i1), ctx)
      results.push(...nodes)
    }
    return results
  }

  function processInlines(nodePoints: readonly INodePoint[]): Node[] {
    if (nodePoints.length <= 0) return []
    const inlineTokens = matchInlineTokens(nodePoints, 0, nodePoints.length)
    const inlineNodes = parseInlineTokens(inlineTokens)
    return inlineNodes
  }

  function matchInlineTokens(
    nodePoints: readonly INodePoint[],
    startIndexOfBlock: number,
    endIndexOfBlock: number,
  ): readonly IInlineToken[] {
    _nodePoints = nodePoints
    _blockStartIndex = startIndexOfBlock
    _blockEndIndex = endIndexOfBlock

    const tokensStack: readonly IInlineToken[] = phrasingContentProcessor.process(
      [],
      startIndexOfBlock,
      endIndexOfBlock,
    )

    const tokens: readonly IInlineToken[] = resolveFallbackTokens(
      tokensStack,
      startIndexOfBlock,
      endIndexOfBlock,
    )
    return tokens
  }

  function parseInlineTokens(tokens?: readonly IInlineToken[]): Node[] {
    if (tokens === undefined || tokens.length <= 0) return []

    const results: Node[] = []
    for (let i0 = 0, i1: number; i0 < tokens.length; i0 = i1) {
      const _tokenizer: string = tokens[i0]._tokenizer
      for (i1 = i0 + 1; i1 < tokens.length && tokens[i1]._tokenizer === _tokenizer;) i1 += 1

      const hook = parseInlineHookMap.get(_tokenizer)

      // cannot find matched tokenizer
      invariant(hook !== undefined, `[parseBlock] tokenizer '${_tokenizer}' not found`)

      const nodes: Node[] = hook.parse(tokens.slice(i0, i1))
      results.push(...nodes)
    }
    return results
  }
}
