import type {
  TokenizerHookState,
  TokenizerHookStateTree,
} from '@yozora/tokenizercore'
import type { YastBlockNodeType } from '../node'
import type { BlockTokenizerMatchPhaseStateData } from './match'


/**
 * Hooks on the post-match phase
 */
export interface BlockTokenizerPostMatchPhaseHook {
  /**
   * Transform matchStates
   * closedMatchPhaseStates are peers nodes that have a common parent node
   */
  transformMatch: (
    closedMatchPhaseStates: Readonly<ClosedBlockTokenizerMatchPhaseState[]>,
  ) => ClosedBlockTokenizerMatchPhaseState[]
}


/**
 * State tree on post-match phase of BlockTokenizer
 */
export type ClosedBlockTokenizerMatchPhaseStateTree<
  T extends YastBlockNodeType = YastBlockNodeType
  > = TokenizerHookStateTree<ClosedBlockTokenizerMatchPhaseState<T>>


/**
 * State on post-match phase of BlockTokenizer
 */
export type ClosedBlockTokenizerMatchPhaseState<
  T extends YastBlockNodeType = YastBlockNodeType
  > =
  & TokenizerHookState<
    ClosedBlockTokenizerMatchPhaseState<T>
    & BlockTokenizerMatchPhaseStateData<T>
  >
  & BlockTokenizerMatchPhaseStateData<T>
