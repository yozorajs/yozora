import type { ParagraphPreMatchPhaseState } from '@yozora/tokenizer-paragraph'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  BlockTokenizerPreMatchPhaseState,
  PhrasingContentDataNode,
  PhrasingContentMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof SetextHeading
 */
export const SetextHeadingType = 'SETEXT_HEADING'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SetextHeadingType = typeof SetextHeadingType


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
export interface SetextHeading extends
  YastBlockNode<SetextHeadingType>,
  BlockTokenizerParsePhaseState<SetextHeadingType> {
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
  extends BlockTokenizerPreMatchPhaseState<SetextHeadingType> {
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
  extends BlockTokenizerMatchPhaseState<SetextHeadingType> {
  /**
   * Level of heading
   */
  depth: number
  /**
   * Contents of heading
   */
  children: [PhrasingContentMatchPhaseState]
}
