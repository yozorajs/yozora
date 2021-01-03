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
export interface InlineTokenizerProps<T extends YastInlineNodeType = YastInlineNodeType> {
  /**
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number
  /**
   * The name of the tokenizer
   */
  readonly name?: string
  /**
   * The node types that the current tokenizer can recognize, is used to
   * quickly locate the tokenizer which can handle this type of data.
   */
  readonly uniqueTypes?: T[]
}


/**
 * Tokenizer for handing inline data node
 */
export interface InlineTokenizer<T extends YastInlineNodeType = YastInlineNodeType> {
  /**
   * The name of the tokenizer
   */
  readonly name: string
  /**
   * The priority of the tokenizer.
   * The larger the value, the higher the priority.
   */
  readonly priority: number
  /**
   * The node types that the current tokenizer can recognize, is used to
   * quickly locate the tokenizer which can handle this type of data.
   */
  readonly uniqueTypes: T[]
}


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
