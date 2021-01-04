import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
  PhrasingContent,
  PhrasingContentLine,
  YastBlockNode,
} from '@yozora/tokenizercore-block'


/**
 * typeof Paragraph
 */
export const ParagraphType = 'PARAGRAPH'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ParagraphType = typeof ParagraphType


/**
 * 段落块
 * Paragraph represents a unit of discourse dealing with a particular point or idea.
 *
 * @example
 *    ````markdown
 *    Alpha bravo charlie.
 *    ````
 *    ==>
 *    ```js
 *    {
 *      type: 'PARAGRAPH',
 *      children: [{ type: 'TEXT', value: 'Alpha bravo charlie.' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#paragraph
 * @see https://github.github.com/gfm/#paragraphs
 */
export interface Paragraph extends
  YastBlockNode<ParagraphType>,
  BlockTokenizerParsePhaseState<ParagraphType> {
  /**
   * 段落内容
   * Contents of paragraph
   */
  children: PhrasingContent[]
}


/**
 * State of match phase of ParagraphTokenizer
 */
export interface ParagraphMatchPhaseState
  extends BlockTokenizerMatchPhaseState<ParagraphType> {
  /**
   * paragraph 中的文本内容
   */
  lines: PhrasingContentLine[]
}
