import type { Tokenizer, YastNode, YastNodeType } from '@yozora/tokenizercore'
import type { ImmutableBlockTokenizerContext } from './context'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
} from './lifecycle/match'
import type { BlockTokenizerParsePhaseHook } from './lifecycle/parse'
import type { BlockTokenizerPostMatchPhaseState } from './lifecycle/post-match'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
} from './phrasing-content'


/**
 * Tokenizer for handling block data node
 */
export interface BlockTokenizer<
  T extends YastNodeType = YastNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PMS extends BlockTokenizerPostMatchPhaseState<T> = BlockTokenizerPostMatchPhaseState<T>,
  >
  extends Tokenizer {
  /**
   * Get context of the block tokenizer
   */
  getContext: () => ImmutableBlockTokenizerContext | null

  /**
   * Extract array of PhrasingContentLine from a given BlockTokenizerMatchPhaseState
   *
   * @param state
   */
  extractPhrasingContentLines?: (
    state: Readonly<MS>,
  ) => ReadonlyArray<PhrasingContentLine> | null

  /**
   * Build BlockTokenizerPostMatchPhaseState from
   * a PhrasingContentMatchPhaseState
   *
   * @param nodePoints
   * @param originalState
   * @param lines
   */
  buildPostMatchPhaseState?: (
    originalState: PMS,
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => PMS | null
}


/**
 * Fallback BlockTokenizer
 */
export interface FallbackBlockTokenizer<
  T extends YastNodeType = YastNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PMS extends BlockTokenizerPostMatchPhaseState<T> = BlockTokenizerPostMatchPhaseState<T>,
  PS extends YastNode<T> = YastNode<T>>
  extends
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS> {
  /**
   * Build PhrasingContent from lines
   *
   * @param nodePoints
   * @param state
   */
  buildPhrasingContent: (
    state: Readonly<PhrasingContentPostMatchPhaseState>,
  ) => PhrasingContent | null
}
