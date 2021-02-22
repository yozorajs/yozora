import type { NodePoint } from '@yozora/character'
import type { TokenizerContext } from './context'
import type {
  TokenizerMatchBlockHook,
  YastBlockState,
} from './lifecycle/match-block'
import type { TokenizerParseBlockHook } from './lifecycle/parse-block'
import type { TokenizerParseInlineHook } from './lifecycle/parse-inline'
import type { YastMeta, YastNode, YastNodeType } from './node'
import type { YastToken } from './token'


/**
 * YastNode Tokenizer.
 */
export interface Tokenizer {
  /**
   * Name of a tokenizer (in order to identify a unique YastNode Tokenizer)
   */
  readonly name: string

  /**
   * Get context of the block tokenizer
   */
  getContext: () => TokenizerContext | null
}



/**
 * Fallback Tokenizer on the processing block structure phase .
 */
export interface BlockFallbackTokenizer<
  T extends YastNodeType = YastNodeType,
  State extends YastBlockState<T> = YastBlockState<T>,
  Node extends YastNode<T> = YastNode<T>
  >
  extends
  Tokenizer,
  TokenizerMatchBlockHook<T, State>,
  TokenizerParseBlockHook<T, State, Node> { }



/**
 * Fallback Tokenizer on the processing inline structure phase .
 */
export interface InlineFallbackTokenizer<
  T extends YastNodeType = YastNodeType,
  Meta extends YastMeta = YastMeta,
  Token extends YastToken<T> = YastToken<T>,
  Node extends YastNode<T> = YastNode<T>
  >
  extends
  Tokenizer,
  TokenizerParseInlineHook<T, Meta, Token, Node> {
  /**
    * @param startIndex
    * @param endIndex
    * @param nodePoints
    * @param meta
    */
  findAndHandleDelimiter: (
    startIndex: number,
    endIndex: number,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<Meta>,
  ) => Token
}
