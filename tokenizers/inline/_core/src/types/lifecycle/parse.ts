import { DataNodeTokenPointDetail } from '@yozora/tokenizercore'
import { InlineDataNodeType } from '../base'
import { InlineTokenizerMatchPhaseState } from './match'


/**
 * State of parse phase
 */
export interface InlineTokenizerParsePhaseState<
  T extends InlineDataNodeType = InlineDataNodeType,
  > {
  /**
   *
   */
  type: T
  /**
   *
   */
  children?: InlineTokenizerParsePhaseState[]
}


/**
 * State-tree of parse phase
 */
export interface InlineTokenizerParsePhaseStateTree<M = any> {
  /**
   *
   */
  type: 'root'
  /**
   *
   */
  children: InlineTokenizerParsePhaseState[]
}


/**
 * Hooks in the parse phase
 */
export interface InlineTokenizerParsePhaseHook<
  T extends InlineDataNodeType = InlineDataNodeType,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  PFS extends InlineTokenizerParsePhaseState<T> = InlineTokenizerParsePhaseState<T>,
  > {
  /**
   * Parse matchStates classified to flow
   */
  parse: (
    codePositions: DataNodeTokenPointDetail[],
    matchPhaseState: MS,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ) => PFS
}
