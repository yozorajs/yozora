import type { Tokenizer, TokenizerProps } from '@yozora/tokenizercore'
import type { YastInlineNodeType } from './base'
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
export interface InlineTokenizerProps<T extends YastInlineNodeType = YastInlineNodeType>
  extends TokenizerProps<T> { }


/**
 * Tokenizer for handing inline data node
 */
export interface InlineTokenizer<T extends YastInlineNodeType = YastInlineNodeType>
  extends Tokenizer<T> { }


/**
 * Fallback InlineTokenizer
 */
export type FallbackInlineTokenizer =
  & InlineTokenizer<YastInlineNodeType>
  & InlineTokenizerMatchPhaseHook<
    YastInlineNodeType,
    InlineTokenizerMatchPhaseState<YastInlineNodeType & any>,
    InlineTokenDelimiter<YastInlineNodeType & any>,
    InlinePotentialToken<YastInlineNodeType & any, InlineTokenDelimiter<any>>
  >
  & InlineTokenizerParsePhaseHook<
    YastInlineNodeType,
    InlineTokenizerMatchPhaseState<YastInlineNodeType & any>,
    InlineTokenizerParsePhaseState
  >
