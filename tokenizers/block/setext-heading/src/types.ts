import type { ParagraphPreMatchPhaseState } from '@yozora/tokenizer-paragraph'
import type {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
  PhrasingContentDataNode,
  PhrasingContentMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof SetextHeadingDataNode
 */
export const SetextHeadingDataNodeType = 'SETEXT_HEADING'
export type SetextHeadingDataNodeType = typeof SetextHeadingDataNodeType


/**
 *
 * @example
 *    ````markdown
 *    Foo
 *    Bar
 *    ---
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'SETEXT_HEADING',
 *      depth: 2,
 *      children: [{ type: 'TEXT', value: 'Foo\nBar' }]
 *    }
 *    ```
 * @see https://github.github.com/gfm/#setext-heading
 */
export interface SetextHeadingDataNode extends
  BlockDataNode<SetextHeadingDataNodeType>,
  BlockTokenizerParsePhaseState<SetextHeadingDataNodeType> {
  /**
   * 标题的级别
   * level of heading
   */
  depth: number
  /**
   * 标题内容
   * Contents of heading
   */
  children: [PhrasingContentDataNode]
}


/**
 * State of pre-match phase of SetextHeadingTokenizer
 */
export interface SetextHeadingPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<SetextHeadingDataNodeType> {
  /**
   * CodePoint of '-' / '='
   */
  marker: number
  /**
   * Contents of heading
   */
  children: [ParagraphPreMatchPhaseState]
}


/**
 * State of match phase of SetextHeadingTokenizer
 */
export interface SetextHeadingMatchPhaseState
  extends BlockTokenizerMatchPhaseState<SetextHeadingDataNodeType> {
  /**
   * Level of heading
   */
  depth: number
  /**
   * Contents of heading
   */
  children: [PhrasingContentMatchPhaseState]
}
