import type { Tokenizer, YastNode, YastNodeType } from '@yozora/tokenizercore'
import type { PhrasingContentLine } from '../phrasing-content/types'
import type { ImmutableBlockTokenizerContext } from './context'
import type {
  BlockTokenizerMatchPhaseHook,
  YastBlockState,
} from './lifecycle/match'
import type { BlockTokenizerParsePhaseHook } from './lifecycle/parse'


/**
 * Tokenizer for handling block data node
 */
export interface BlockTokenizer<
  T extends YastNodeType = YastNodeType,
  State extends YastBlockState<T> = YastBlockState<T>>
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
    state: Readonly<State>,
  ) => ReadonlyArray<PhrasingContentLine> | null

  /**
   * Build BlockTokenizerPostMatchPhaseState from
   * a PhrasingContentMatchPhaseState
   *
   * @param lines
   * @param originalState
   */
  buildBlockState?: (
    lines: ReadonlyArray<PhrasingContentLine>,
    originalState: State,
  ) => State | null
}


/**
 * Fallback BlockTokenizer
 */
export interface FallbackBlockTokenizer<
  T extends YastNodeType = YastNodeType,
  State extends YastBlockState<T> = YastBlockState<T>,
  Node extends YastNode<T> = YastNode<T>>
  extends
  BlockTokenizer<T, State>,
  BlockTokenizerMatchPhaseHook<T, State>,
  BlockTokenizerParsePhaseHook<T, State, Node> { }
