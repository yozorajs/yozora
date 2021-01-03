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
import type { PhrasingContentLine } from './phrasing'


/**
 * Params for constructing BlockTokenizer
 */
export interface BlockTokenizerProps<T extends YastBlockNodeType = YastBlockNodeType>
  extends TokenizerProps<T> { }


/**
 * Tokenizer for handling block data node
 */
export interface BlockTokenizer<T extends YastBlockNodeType = YastBlockNodeType>
  extends Tokenizer<T> { }


/**
 * Fallback BlockTokenizer
 */
export interface FallbackBlockTokenizer extends
  BlockTokenizer<YastBlockNodeType>,
  BlockTokenizerMatchPhaseHook<
    YastBlockNodeType,
    BlockTokenizerMatchPhaseState<YastBlockNodeType & any>
  >,
  BlockTokenizerParsePhaseHook<
    YastBlockNodeType,
    BlockTokenizerMatchPhaseState<YastBlockNodeType & any> | any,
    BlockTokenizerParsePhaseState<YastBlockNodeType & any>
  > {
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
  ): BlockTokenizerMatchPhaseState
}
