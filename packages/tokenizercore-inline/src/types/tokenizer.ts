import type { NodePoint } from '@yozora/character'
import type { Tokenizer, YastMeta } from '@yozora/tokenizercore'
import type { ImmutableInlineTokenizerContext } from './context'
import type { InlineTokenizerMatchPhaseState } from './lifecycle/match'
import type { InlineTokenizerParsePhaseHook } from './lifecycle/parse'
import type { YastInlineNode, YastInlineNodeType } from './node'


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
  T extends YastInlineNodeType = YastInlineNodeType,
  M extends YastMeta = YastMeta,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  PS extends YastInlineNode<T> = YastInlineNode<T>>
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
