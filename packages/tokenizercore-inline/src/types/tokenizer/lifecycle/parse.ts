import type { EnhancedYastNodePoint, YastMeta } from '@yozora/tokenizercore'
import type { YastInlineNode, YastInlineNodeType } from '../../node'
import type { InlineTokenizerMatchPhaseState } from './match'


/**
 * State of parse phase
 */
export interface InlineTokenizerParsePhaseState<T extends YastInlineNodeType = YastInlineNodeType>
  extends YastInlineNode<T> {
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
  readonly type: 'root'
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
  M extends YastMeta = YastMeta,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  PS extends InlineTokenizerParsePhaseState<T> = InlineTokenizerParsePhaseState<T>,
  > {
  /**
   * Parse matchStates classified to flow
   *
   * @param nodePoints      An array of EnhancedYastNodePoint
   * @param meta            Meta of the Yast
   * @param matchPhaseState
   * @param parsedChildren
   */
  parse: (
    nodePoints: ReadonlyArray<EnhancedYastNodePoint>,
    meta: Readonly<M>,
    matchPhaseState: MS,
    parsedChildren?: InlineTokenizerParsePhaseState[],
  ) => PS
}