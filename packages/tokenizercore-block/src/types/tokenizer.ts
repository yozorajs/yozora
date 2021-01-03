import type { Tokenizer, TokenizerProps } from '@yozora/tokenizercore'
import type { YastBlockNodeMeta, YastBlockNodeType } from './base'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
} from './lifecycle/match'
import type {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
} from './lifecycle/parse'
import type {
  BlockTokenizerPreMatchPhaseHook,
  BlockTokenizerPreMatchPhaseState,
} from './lifecycle/pre-match'
import type { BlockTokenizerPreParsePhaseState } from './lifecycle/pre-parse'
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
  BlockTokenizerPreMatchPhaseHook<
    YastBlockNodeType,
    BlockTokenizerPreMatchPhaseState<YastBlockNodeType & any> | any
  >,
  BlockTokenizerMatchPhaseHook<
    YastBlockNodeType,
    BlockTokenizerPreMatchPhaseState<YastBlockNodeType & any> | any,
    BlockTokenizerMatchPhaseState<YastBlockNodeType & any>
  >,
  BlockTokenizerParsePhaseHook<
    YastBlockNodeType,
    BlockTokenizerMatchPhaseState<YastBlockNodeType & any> | any,
    BlockTokenizerParsePhaseState<YastBlockNodeType & any>,
    YastBlockNodeMeta,
    BlockTokenizerPreParsePhaseState<YastBlockNodeMeta & any>
  > {
  /**
   *
   * @param opening
   * @param parent
   * @param lines
   */
  createPreMatchPhaseState(
    opening: boolean,
    parent: BlockTokenizerPreMatchPhaseState,
    lines: PhrasingContentLine[],
  ): BlockTokenizerPreMatchPhaseState
}
