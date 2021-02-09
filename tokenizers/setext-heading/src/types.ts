import type { YastNode } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
  PhrasingContent,
  PhrasingContentLine,
} from '@yozora/tokenizercore-block'


/**
 * typeof SetextHeading
 */
export const SetextHeadingType = 'setextHeading'
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
 *      type: 'setextHeading',
 *      depth: 2,
 *      children: [{ type: 'text', value: 'Foo\nBar' }]
 *    }
 *    ```
 * @see https://github.github.com/gfm/#setext-heading
 */
export interface SetextHeading extends YastNode<SetextHeadingType> {
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
  /**
   * Contents
   */
  lines: ReadonlyArray<PhrasingContentLine>
}
