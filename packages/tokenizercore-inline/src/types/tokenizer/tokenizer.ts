import type {
  Tokenizer,
  TokenizerProps,
  YastMeta,
} from '@yozora/tokenizercore'
import type { ImmutableInlineTokenizerContext } from '../context'
import type { YastInlineNodeType } from '../node'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseHook,
  InlineTokenizerMatchPhaseState,
} from './lifecycle/match'
import type {
  InlineTokenizerParsePhaseHook,
  InlineTokenizerParsePhaseState,
} from './lifecycle/parse'


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
export interface InlineTokenizer<T extends YastInlineNodeType = YastInlineNodeType>
  extends Tokenizer<T> {
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
  TD extends InlineTokenDelimiter = InlineTokenDelimiter,
  PS extends InlineTokenizerParsePhaseState<T> = InlineTokenizerParsePhaseState<T>>
  extends
  InlineTokenizer<T>,
  InlineTokenizerMatchPhaseHook<T, M, MS, TD>,
  InlineTokenizerParsePhaseHook<T, M, MS, PS> {

}
