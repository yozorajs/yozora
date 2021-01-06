import type { Tokenizer, TokenizerProps } from '@yozora/tokenizercore'
import type { ImmutableBlockTokenizerContext } from './context'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
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
  extends TokenizerProps<T> { }


/**
 * Tokenizer for handling block data node
 */
export interface BlockTokenizer<T extends YastBlockNodeType = YastBlockNodeType>
  extends Tokenizer<T> {
  /**
   * Get context of the block tokenizer
   */
  getContext: () => ImmutableBlockTokenizerContext | null
}


/**
 * Fallback BlockTokenizer
 */
export interface FallbackBlockTokenizer<
  T extends YastBlockNodeType = YastBlockNodeType,
  MSD extends BlockTokenizerMatchPhaseStateData<T> = BlockTokenizerMatchPhaseStateData<T>,
  PS extends BlockTokenizerParsePhaseState<T> = BlockTokenizerParsePhaseState<T>>
  extends
  BlockTokenizer<T>,
  BlockTokenizerMatchPhaseHook<T, MSD>,
  BlockTokenizerParsePhaseHook<T, MSD, PS> {
  /**
   * Create a PhrasingContentMatchPhaseState from given parameters.
   * @param opening
   * @param parent
   * @param lines
   */
  buildPhrasingContentMatchPhaseState: (
    opening: boolean,
    parent: BlockTokenizerMatchPhaseState,
    lines: PhrasingContentLine[],
  ) => BlockTokenizerMatchPhaseState & MSD
}
