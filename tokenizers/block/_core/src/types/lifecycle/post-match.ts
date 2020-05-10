import { BlockDataNodeType } from '../base'
import { BlockTokenizerMatchPhaseState } from './match'


/**
 * Hooks in the post-match phase
 */
export interface BlockTokenizerPostMatchPhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  OMS extends BlockTokenizerMatchPhaseState = BlockTokenizerMatchPhaseState,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  > {
  /**
   * Replace/Remove/Do-nothing the given matchState
   *
   * @return
   *  - {MS}: replace the originalMatchPhaseState with the new matchState
   *  - {false}: remove the originalMatchPhaseState from BlockTokenizerMatchPhaseStateTree
   *  - {null}: do nothing
   */
  transformMatch: (
    originalMatchPhaseState: Readonly<OMS>,
    originalPreviousSiblingState?: Readonly<BlockTokenizerMatchPhaseState>,
  ) => MS | null | false
}
