import type { NodePoint } from '@yozora/character'
import type { YastMeta, YastNode, YastNodeType } from '@yozora/tokenizercore'
import type { InlineTokenizerMatchPhaseState } from './match'


/**
 * Hooks in the parse phase
 */
export interface InlineTokenizerParsePhaseHook<
  T extends YastNodeType = YastNodeType,
  M extends YastMeta = YastMeta,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  PS extends YastNode<T> = YastNode<T>,
  > {
  /**
   * Types of InlineTokenizerMatchPhaseState which this tokenizer could handle.
   */
  readonly recognizedTypes: YastNodeType[]

  /**
   * Parse matchStates classified to flow
   *
   * @param state
   * @param parsedChildren
   * @param nodePoints      An array of NodePoint
   * @param meta            Meta of the Yast
   */
  parse: (
    state: MS,
    parsedChildren: YastNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => PS
}
