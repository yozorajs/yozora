import type { NodePoint } from '@yozora/character'
import type {
  Tokenizer,
  YastMeta,
  YastNode,
  YastNodeType,
} from '@yozora/tokenizercore'
import type { ImmutableInlineTokenizerContext } from './context'
import type { YastToken } from './lifecycle/match'
import type { InlineTokenizerParsePhaseHook } from './lifecycle/parse'


/**
 * Tokenizer for handing inline data node
 */
export interface InlineTokenizer extends Tokenizer {
  /**
   * Get context of the block tokenizer
   */
  getContext: () => ImmutableInlineTokenizerContext | null
}


/**
 * Fallback InlineTokenizer
 */
export interface FallbackInlineTokenizer<
  T extends YastNodeType = YastNodeType,
  M extends YastMeta = YastMeta,
  MS extends YastToken<T> = YastToken<T>,
  PS extends YastNode<T> = YastNode<T>>
  extends
  InlineTokenizer,
  InlineTokenizerParsePhaseHook<T, M, MS, PS> {
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
    meta: Readonly<M>,
  ) => MS
}
