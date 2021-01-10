import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  PhrasingContent,
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
export interface SetextHeading extends YastBlockNode<SetextHeadingType> {
  /**
   * Level of a heading
   */
  depth: number
  /**
   * Contents of a heading
   */
  children: PhrasingContent[]
}


/**
 * State on match phase of SetextHeadingTokenizer
 */
export type SetextHeadingMatchPhaseState =
  & BlockTokenizerMatchPhaseState<SetextHeadingType>
  & SetextHeadingMatchPhaseStateData


/**
 * State on post-match phase of SetextHeadingTokenizer
 */
export type SetextHeadingPostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<SetextHeadingType>
  & SetextHeadingMatchPhaseStateData


/**
 * State data on match phase of SetextHeadingTokenizer
 */
export interface SetextHeadingMatchPhaseStateData {
  /**
   * CodePoint of '-' / '='
   */
  marker: number
}
