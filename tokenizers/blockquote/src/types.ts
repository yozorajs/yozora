import type { YastNode } from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPostMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof Blockquote
 */
export const BlockquoteType = 'blockquote'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type BlockquoteType = typeof BlockquoteType


/**
 * 引用块
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
export interface Blockquote extends YastNode<BlockquoteType> {
  /**
   * Blockquote is a container block
   */
  children: YastNode[]
}


/**
 * State on match phase of BlockquoteTokenizer
 */
export type BlockquoteMatchPhaseState =
  & BlockTokenizerMatchPhaseState<BlockquoteType>
  & BlockquoteMatchPhaseStateData


/**
 * State on post-match phase of BlockquoteTokenizer
 */
export type BlockquotePostMatchPhaseState =
  & BlockTokenizerPostMatchPhaseState<BlockquoteType>
  & BlockquoteMatchPhaseStateData


/**
 * State data on match phase of BlockquoteTokenizer
 */
export interface BlockquoteMatchPhaseStateData { }
