import type { RootMeta, YastNode } from '@yozora/ast'
import type { NodePoint } from '@yozora/character'
import type { TokenizerContext } from './context'
import type {
  TokenizerMatchBlockHook,
  YastBlockState,
} from './lifecycle/match-block'
import type { TokenizerParseBlockHook } from './lifecycle/parse-block'
import type { TokenizerParseInlineHook } from './lifecycle/parse-inline'
import type { YastToken } from './token'

/**
 * YastNode Tokenizer.
 */
export interface Tokenizer<T extends string = string> {
  /**
   * Name of a tokenizer (in order to identify a unique YastNode Tokenizer)
   */
  readonly name: T
  /**
   * Types of YastBlockState or YastToken which this tokenizer could handle,
   * every type should be unique.
   */
  readonly recognizedTypes: ReadonlyArray<T>
  /**
   * Get context of the block tokenizer
   */
  getContext(): TokenizerContext | null
}

/**
 * Fallback Tokenizer on the processing block structure phase .
 */
export interface BlockFallbackTokenizer<
  T extends string = string,
  State extends YastBlockState<T> = YastBlockState<T>,
  Node extends YastNode = YastNode
> extends Tokenizer<T>,
    TokenizerMatchBlockHook<T, State>,
    TokenizerParseBlockHook<T, State, Node> {}

/**
 * Fallback Tokenizer on the processing inline structure phase .
 */
export interface InlineFallbackTokenizer<
  T extends string = string,
  Meta extends RootMeta = RootMeta,
  Token extends YastToken<T> = YastToken<T>,
  Node extends YastNode = YastNode
> extends Tokenizer<T>,
    TokenizerParseInlineHook<T, Token, Node, Meta> {
  /**
   * @param startIndex
   * @param endIndex
   * @param nodePoints
   * @param meta
   */
  findAndHandleDelimiter(
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ): Token
}
