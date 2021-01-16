import type { Tokenizer, TokenizerProps } from '@yozora/tokenizercore'
import type { ImmutableInlineTokenizerContext } from '../context'
import type { YastInlineNodeType } from '../node'
import type {
  InlinePotentialToken,
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
export type FallbackInlineTokenizer =
  & InlineTokenizer<YastInlineNodeType>
  & InlineTokenizerMatchPhaseHook<
    YastInlineNodeType,
    InlineTokenizerMatchPhaseState<YastInlineNodeType & any>,
    InlineTokenDelimiter & any,
    InlinePotentialToken<YastInlineNodeType & any, InlineTokenDelimiter & any>
  >
  & InlineTokenizerParsePhaseHook<
    YastInlineNodeType,
    InlineTokenizerMatchPhaseState<YastInlineNodeType & any>,
    InlineTokenizerParsePhaseState
  >
