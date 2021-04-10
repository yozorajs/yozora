import type { Root, RootMeta, YastNode, YastNodeType } from '@yozora/ast'
import { calcDefinitions, replaceAST } from '@yozora/ast-util'
import type { NodePoint } from '@yozora/character'
import type {
  BlockFallbackTokenizer,
  InlineFallbackTokenizer,
  PhrasingContent,
  PhrasingContentLine,
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
  calcEndYastNodePoint,
  calcStartYastNodePoint,
} from '@yozora/core-tokenizer'
import invariant from 'tiny-invariant'
import type { TokenizerHookAll, YastBlockTokenTree } from '../types'
import { createBlockContentProcessor } from './block'
import { createPhrasingContentProcessor } from './inline'

export interface ProcessorOptions {
  readonly context: TokenizerContext
  readonly tokenizerHookMap: ReadonlyMap<
    YastNodeType,
    Tokenizer &
      Partial<TokenizerHookAll> &
      TokenizerParseBlockHook &
      TokenizerParseInlineHook
  >
  readonly matchBlockHooks: ReadonlyArray<Tokenizer & TokenizerMatchBlockHook>
  readonly postMatchBlockHooks: ReadonlyArray<
    Tokenizer & TokenizerPostMatchBlockHook
  >
  readonly matchInlineHooks: ReadonlyArray<Tokenizer & TokenizerMatchInlineHook>
  readonly blockFallbackTokenizer: BlockFallbackTokenizer | null
  readonly inlineFallbackTokenizer: InlineFallbackTokenizer | null
  readonly shouldReservePosition: boolean
}

/**
 * Result of __handle__
 */
export interface Processor {
  /**
   * Parse phrasing lines into Yozora AST Root.
   * @param lines
   */
  process(lines: Iterable<PhrasingContentLine[]>): Root
}

/**
 *
 * @param options
 */
export function createProcessor(options: ProcessorOptions): Processor {
  const {
    context,
    tokenizerHookMap,
    matchBlockHooks,
    postMatchBlockHooks,
    matchInlineHooks,
    blockFallbackTokenizer,
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
  return { process }

  function process(lines: Iterable<PhrasingContentLine[]>): Root {
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
   * match-block phase.
   */
  function matchBlockTokens(
    linesIterator: Iterable<PhrasingContentLine[]>,
  ): YastBlockTokenTree {
    const processor = createBlockContentProcessor(
      context,
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
      const resultOfParse = hook.parseBlock(token, children)
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
    processor.process(startIndexOfBlock, endIndexOfBlock, nodePoints, meta)

    const tokensStack: YastInlineToken[] = processor.done()
    const tokens: YastInlineToken[] = context.resolveFallbackTokens(
      tokensStack,
      startIndexOfBlock,
      endIndexOfBlock,
      nodePoints,
      meta,
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
}
