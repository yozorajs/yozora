import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import { InlineDataNodeType } from '../base'
import { InlineTokenizerPreMatchPhaseState } from './pre-match'


/**
 * State of match phase
 */
export interface InlineTokenizerMatchPhaseState<
  T extends InlineDataNodeType = InlineDataNodeType,
  > {
  /**
   *
   */
  type: T
  /**
   *
   */
  children?: InlineTokenizerMatchPhaseState[]
}


/**
 * State-tree of match phase
 */
export interface InlineTokenizerMatchPhaseStateTree {
  /**
   *
   */
  type: 'root'
  /**
   *
   */
  children: InlineTokenizerMatchPhaseState[]
}


/**
 * Hooks in the match phase
 */
export interface InlineTokenizerMatchPhaseHook<
  T extends InlineDataNodeType = InlineDataNodeType,
  PMS extends InlineTokenizerPreMatchPhaseState<T> = InlineTokenizerPreMatchPhaseState<T>,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  > {
  /**
   *
   * Format/Remove the given preMatchState
   *
   * @return
   *  - {MS}: format preMatchState to the returned matchState
   *  - {false}: ignore this preMatchState
   */
  match: (
    codePositions: DataNodeTokenPointDetail[],
    preMatchPhaseState: PMS
  ) => MS | false
}
