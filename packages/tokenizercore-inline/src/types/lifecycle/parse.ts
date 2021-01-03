import type { RawContent, YastInlineNodeType } from '../base'
import type { InlineTokenizerMatchPhaseState } from './match'


/**
 * State of parse phase
 */
export interface InlineTokenizerParsePhaseState<
  T extends YastInlineNodeType = YastInlineNodeType,
  > {
  /**
   * Type of parse phase state
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
export interface InlineTokenizerParsePhaseStateTree {
  /**
   * Root type of parse phase state-tree
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
  T extends YastInlineNodeType = YastInlineNodeType,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  PFS extends InlineTokenizerParsePhaseState<T> = InlineTokenizerParsePhaseState<T>,
  > {
  /**
   * Parse matchStates classified to flow
   */
  parse: (
    rawContent: RawContent,
    matchPhaseState: MS,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ) => PFS
}
