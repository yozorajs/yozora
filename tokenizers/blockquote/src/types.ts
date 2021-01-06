import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  BlockTokenizerParsePhaseState,
  ClosedBlockTokenizerMatchPhaseState,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof Blockquote
 */
export const BlockquoteType = 'BLOCKQUOTE'
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
 *      type: 'BLOCKQUOTE',
 *      children: [{
 *        type: 'PARAGRAPH',
 *        children: [{ type: 'TEXT', value: 'Alpha bravo charlie.' }]
 *      }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 */
export interface Blockquote extends YastBlockNode<BlockquoteType> {
  /**
   * Blockquote is a container block
   */
  children: BlockTokenizerParsePhaseState[]
}


/**
 * State on match phase of BlockquoteTokenizer
 */
export type BlockquoteMatchPhaseState =
  & BlockTokenizerMatchPhaseState
  & BlockquoteMatchPhaseStateData


/**
 * Closed state on match phase of BlockquoteTokenizer
 */
export type ClosedBlockquoteMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & BlockquoteMatchPhaseStateData


/**
 * State data on match phase of BlockquoteTokenizer
 */
export interface BlockquoteMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<BlockquoteType> { }
