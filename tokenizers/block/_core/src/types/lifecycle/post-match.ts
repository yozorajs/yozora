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
   * - Replace/Remove/Do-nothing the given matchState.
   * - Continue/Terminate the subsequent processing
   *
   * @return
   *  * `null`: No changed have been performed. Continue to use
   *    originalMatchPhaseState as the parameter to the subsequent transformHooks
   *  * `{nextState: null, final: true}`: Remove the originalMatchPhaseState
   *    from BlockTokenizerMatchPhaseStateTree, and terminate the transformation
   *    processing of the subsequent transformHooks
   *  * `{nextState: MS, final: boolean}`:
   *    - nextState: the next OriginalMatchPhaseState passed to the subsequent
   *      transformHooks
   *    - `final=true`: terminate the transformation processing of the
   *      subsequent transformHooks
   */
  transformMatch: (
    originalMatchPhaseState: Readonly<OMS>,
    originalPreviousSiblingState?: Readonly<BlockTokenizerMatchPhaseState>,
  ) =>
    | { nextState: MS, final: boolean }
    | { nextState: null, final: true }
    | null
}
