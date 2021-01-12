import type { Tokenizer, TokenizerProps } from '@yozora/tokenizercore'
import type { ImmutableBlockTokenizerContext } from '../context'
import type { YastBlockNodeType } from '../node'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
} from './lifecycle/match'
import type {
  BlockTokenizerParsePhaseHook,
  BlockTokenizerParsePhaseState,
} from './lifecycle/parse'
import type { BlockTokenizerPostMatchPhaseState } from './lifecycle/post-match'
import type {
  PhrasingContent,
  PhrasingContentLine,
  PhrasingContentPostMatchPhaseState,
} from './phrasing-content'


/**
 * Params for constructing BlockTokenizer
 */
export interface BlockTokenizerProps extends TokenizerProps {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer,
   * used in couldInterruptPreviousSibling, you can overwrite that function to
   * mute this properties
   */
  readonly interruptableTypes?: YastBlockNodeType[]
}


/**
 * Tokenizer for handling block data node
 */
export interface BlockTokenizer<
  T extends YastBlockNodeType = YastBlockNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PMS extends BlockTokenizerPostMatchPhaseState<T> = BlockTokenizerPostMatchPhaseState<T>,
  >
  extends Tokenizer<T> {
  /**
   * YastNode types that can be interrupt by this BlockTokenizer,
   * used in couldInterruptPreviousSibling, you can overwrite that function to
   * mute this properties
   */
  readonly interruptableTypes: YastBlockNodeType[]

  /**
   * Get context of the block tokenizer
   */
  getContext: () => ImmutableBlockTokenizerContext | null

  /**
   * Check if the previous node can be interrupted on *match* phase.
   *
   * The context will try to call `this.eatAndInterruptPreviousSibling` first,
   * then try to call `this.eatOpener` if the previous one is absent.
   *
   * @param type      type of previous sibling node
   * @param priority  priority of the tokenizer which is responsible for
   *                  the previous sibling nod
   */
  couldInterruptPreviousSibling: (
    type: YastBlockNodeType,
    priority: number,
  ) => boolean

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
  T extends YastBlockNodeType = YastBlockNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  PMS extends BlockTokenizerPostMatchPhaseState<T> = BlockTokenizerPostMatchPhaseState<T>,
  PS extends BlockTokenizerParsePhaseState<T> = BlockTokenizerParsePhaseState<T>>
  extends
  BlockTokenizer<T, MS, PMS>,
  BlockTokenizerMatchPhaseHook<T, MS>,
  BlockTokenizerParsePhaseHook<T, PMS, PS> {
  /**
   * Build PhrasingContent from lines
   *
   * @param state
   */
  buildPhrasingContent: (
    state: Readonly<PhrasingContentPostMatchPhaseState>,
  ) => PhrasingContent | null
}