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
   * Type of match phase state
   */
  type: T
  /**
   * Start index of state in codePositions
   */
  startIndex: number
  /**
   * End index of state in codePositions
   */
  endIndex: number
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
   * Root type of match phase state-tree
   */
  type: 'root'
  /**
   * Start index of root state in codePositions
   */
  startIndex: number
  /**
   * End index of root state in codePositions
   */
  endIndex: number
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
