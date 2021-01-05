import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
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
 * State on match phase of ParagraphTokenizer
 */
export type ParagraphMatchPhaseState =
  & BlockTokenizerMatchPhaseState
  & ParagraphMatchPhaseStateData


/**
 * State data on match phase of ParagraphTokenizer
 */
export interface ParagraphMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<ParagraphType> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
}
