import type {
  EnhancedYastNodePoint,
  Tokenizer,
  TokenizerProps,
  YastMeta,
} from '@yozora/tokenizercore'
import type { ImmutableInlineTokenizerContext } from '../context'
import type { YastInlineNode, YastInlineNodeType } from '../node'
import type { InlineTokenizerMatchPhaseState } from './lifecycle/match'
import type { InlineTokenizerParsePhaseHook } from './lifecycle/parse'


/**
 * Params for constructing InlineTokenizer
 */
export interface InlineTokenizerProps extends TokenizerProps {
  /**
   * Priority of a tokenizer (for execution order and interruptable judge)
   */
  readonly priority: number
}


/**
 * Tokenizer for handing inline data node
 */
export interface InlineTokenizer extends Tokenizer {
  /**
   * Priority of a tokenizer (for execution order and interruptable judge)
   */
  readonly priority: number

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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
  ) => MS
}
