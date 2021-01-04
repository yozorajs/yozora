import type { Tokenizer, TokenizerProps } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
} from './lifecycle/match'
import type {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
} from './lifecycle/parse'
import type { YastBlockNodeType } from './node'
import type { PhrasingContentLine } from './phrasing-content'


/**
 * Params for constructing BlockTokenizer
 */
export interface BlockTokenizerProps<T extends YastBlockNodeType = YastBlockNodeType>
  extends TokenizerProps<T> {
  }


/**
 * Tokenizer for handling block data node
 */
export interface BlockTokenizer<T extends YastBlockNodeType = YastBlockNodeType>
  extends Tokenizer<T> {
  }


/**
 * Fallback BlockTokenizer
 */
export interface FallbackBlockTokenizer<
  T extends YastBlockNodeType = YastBlockNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PS extends BlockTokenizerParsePhaseState<T> = BlockTokenizerParsePhaseState<T>>
  extends
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, MS, PS> {
  /**
   *
   * @param opening
   * @param parent
   * @param lines
   */
  createMatchPhaseState(
    opening: boolean,
    parent: BlockTokenizerMatchPhaseState,
    lines: PhrasingContentLine[],
  ): MS
}
