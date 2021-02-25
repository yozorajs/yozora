import type {
  PhrasingContent,
  PhrasingContentLine,
  YastBlockState,
  YastNode,
  YastParent,
} from '@yozora/core-tokenizer'

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
export interface SetextHeading extends YastNode<SetextHeadingType>, YastParent {
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
 * Middle state during the whole match and parse phase.
 */
export interface SetextHeadingState extends YastBlockState<SetextHeadingType> {
  /**
   * CodePoint of '-' / '='
   */
  marker: number
  /**
   * Contents
   */
  lines: ReadonlyArray<PhrasingContentLine>
}
