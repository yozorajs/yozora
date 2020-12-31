import type { InlineDataNodeType } from './base'
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
 * 内联数据节点的分词器的构造函数的参数
 *
 * Params for InlineTokenizerConstructor
 */
export interface InlineTokenizerConstructorParams<
  T extends InlineDataNodeType = InlineDataNodeType> {
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
   * The data node type that the current tokenizer can recognize, used in the
   * match and parse phase to quickly locate the tokenizer corresponding to the
   * data node
   */
  readonly uniqueTypes?: T[]
}


/**
 * 内联数据节点的分词器
 *
 * Tokenizer for Inline data node
 */
export interface InlineTokenizer<T extends InlineDataNodeType = InlineDataNodeType> {
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
   * The data node type that the current tokenizer can recognize, used in the
   * match and parse phase to quickly locate the tokenizer corresponding to the
   * data node
   */
  readonly uniqueTypes: T[]
}


/**
 * Fallback InlineTokenizer
 */
export type FallbackInlineTokenizer =
  & InlineTokenizer<InlineDataNodeType>
  & InlineTokenizerMatchPhaseHook<
      InlineDataNodeType,
      InlineTokenizerMatchPhaseState<InlineDataNodeType & any>,
      InlineTokenDelimiter<InlineDataNodeType & any>,
      InlinePotentialToken<InlineDataNodeType & any, InlineTokenDelimiter<any>>
    >
  & InlineTokenizerParsePhaseHook<
      InlineDataNodeType,
      InlineTokenizerMatchPhaseState<InlineDataNodeType & any>,
      InlineTokenizerParsePhaseState
    >
