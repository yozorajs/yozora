import { BlockDataNodeType } from '../types'
import { BlockTokenizerMatchPhaseState } from './match'


/**
 * Hooks in the post-match phase
 */
export interface BlockTokenizerPostMatchPhaseHook<
  T extends BlockDataNodeType = BlockDataNodeType,
  MS extends BlockTokenizerMatchPhaseState<T> = BlockTokenizerMatchPhaseState<T>,
  > {
  /**
   * Replace/Remove/Do-nothing the given matchState
   *
   * @return
   *  - {MS}: replace this matchState with the new matchState
   *  - {false}: remove this matchState from BlockTokenizerMatchPhaseStateTree
   *  - {null}: do nothing
   */
  transformMatch: (
    matchState: BlockTokenizerMatchPhaseState<BlockDataNodeType>,
  ) => MS | null | false
}
