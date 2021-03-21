import type { YastParent } from '@yozora/ast'
import type { YastBlockState } from '@yozora/core-tokenizer'

/**
 * typeof Blockquote
 */
export const BlockquoteType = 'blockquote'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type BlockquoteType = typeof BlockquoteType

/**
 * Blockquote (Parent) represents a section quoted from somewhere else.
 *
 * @example
 *    ````markdown
 *    > Alpha bravo charlie.
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'blockquote',
 *      children: [{
 *        type: 'paragraph',
 *        children: [{ type: 'text', value: 'Alpha bravo charlie.' }]
 *      }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 */
export type Blockquote = YastParent<BlockquoteType>

/**
 * Middle state during the whole match and parse phase.
 */
export interface BlockquoteState extends YastBlockState<BlockquoteType> {
  /**
   *
   */
  children: YastBlockState[]
}
