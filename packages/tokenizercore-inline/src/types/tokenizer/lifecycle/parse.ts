import type { NodePoint } from '@yozora/character'
import type { YastMeta } from '@yozora/tokenizercore'
import type { YastInlineNode, YastInlineNodeType } from '../../node'
import type { InlineTokenizerMatchPhaseState } from './match'


/**
 * Hooks in the parse phase
 */
export interface InlineTokenizerParsePhaseHook<
  T extends YastInlineNodeType = YastInlineNodeType,
  M extends YastMeta = YastMeta,
  MS extends InlineTokenizerMatchPhaseState<T> = InlineTokenizerMatchPhaseState<T>,
  PS extends YastInlineNode<T> = YastInlineNode<T>,
  > {
  /**
   * Types of InlineTokenizerMatchPhaseState which this tokenizer could handle.
   */
  readonly recognizedTypes: YastInlineNodeType[]

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
    parsedChildren: YastInlineNode[] | undefined,
    nodePoints: ReadonlyArray<NodePoint>,
    meta: Readonly<M>,
  ) => PS
}
