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
export interface BlockTokenizer<T extends YastBlockNodeType = YastBlockNodeType>
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
