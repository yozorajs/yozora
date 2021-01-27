import type {
  EnhancedYastNodePoint,
  Tokenizer,
  TokenizerProps,
} from '@yozora/tokenizercore'
import type { ImmutableBlockTokenizerContext } from '../context'
import type { YastBlockNode, YastBlockNodeType } from '../node'
import type {
  BlockTokenizerMatchPhaseHook,
  BlockTokenizerMatchPhaseState,
  EatingLineInfo,
} from './lifecycle/match'
import type { BlockTokenizerParsePhaseHook } from './lifecycle/parse'
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
   * YastNode types that can be recognized by a tokenizer
   */
  readonly uniqueTypes?: YastBlockNodeType[]
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
  extends Tokenizer {
  /**
   * YastNode types that can be recognized by a tokenizer
   */
  readonly uniqueTypes: YastBlockNodeType[]

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
   * @param nodePoints
   * @param eatingInfo
   * @param previousSiblingState  previous sibling state node
   * @param parentState
   */
  couldInterruptPreviousSibling: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    eatingInfo: EatingLineInfo,
    previousSiblingState: Readonly<BlockTokenizerMatchPhaseState>,
    parentState: Readonly<BlockTokenizerMatchPhaseState>,
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
   * Build BlockTokenizerMatchPhaseState from a array of PhrasingContentLine
   *
   * @param originalState
   * @param lines
   */
  buildMatchPhaseState?: (
    originalState: MS,
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => MS | null

  /**
   * Build BlockTokenizerPostMatchPhaseState from
   * a PhrasingContentMatchPhaseState
   *
   * @param nodePoints
   * @param originalState
   * @param lines
   */
  buildPostMatchPhaseState?: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
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
  PS extends YastBlockNode<T> = YastBlockNode<T>>
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
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    state: Readonly<PhrasingContentPostMatchPhaseState>,
  ) => PhrasingContent | null

  /**
   * Build MS from lines
   *
   * @param lines
   */
  buildMatchPhaseStateFromPhrasingContentLine: (
    lines: ReadonlyArray<PhrasingContentLine>,
  ) => MS | null
}
