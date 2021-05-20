import type { YastNode, YastNodeType } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type { TokenizerMatchBlockHook } from './lifecycle/match-block'
import type { MatchInlinePhaseApi } from './lifecycle/match-inline'
import type { TokenizerParseBlockHook } from './lifecycle/parse-block'
import type { TokenizerParseInlineHook } from './lifecycle/parse-inline'
import type { PartialYastBlockToken, PartialYastInlineToken } from './token'

/**
 * YastNode Tokenizer.
 */
export interface Tokenizer {
  /**
   * Name of a tokenizer (in order to identify a unique YastNode Tokenizer)
   */
  readonly name: string
  /**
   * Priority of the tokenizer for handling tighter token situations.
   *
   * For example: Inline code spans, links, images, and HTML tags group more
   * tightly than emphasis.
   *
   * @see https://github.github.com/gfm/#can-open-emphasis #rule17
   */
  readonly priority: number
}

/**
 * Fallback Tokenizer on the processing block structure phase .
 */
export interface BlockFallbackTokenizer<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastBlockToken<T> = PartialYastBlockToken<T>,
  Node extends YastNode<T> = YastNode<T>,
> extends Tokenizer,
    TokenizerMatchBlockHook<T, Token>,
    TokenizerParseBlockHook<T, Token, Node> {}

/**
 * Fallback Tokenizer on the processing inline structure phase .
 */
export interface InlineFallbackTokenizer<
  T extends YastNodeType = YastNodeType,
  Token extends PartialYastInlineToken<T> = PartialYastInlineToken<T>,
  Node extends YastNode<T> = YastNode<T>,
> extends Tokenizer,
    TokenizerParseInlineHook<T, Token, Node> {
  /**
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   * @param api
   */
  findAndHandleDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    api: Readonly<MatchInlinePhaseApi>,
  ): Token
}
