import type {
  PhrasingContent,
  PhrasingContentLine,
  YastBlockState,
  YastNode,
  YastParent,
} from '@yozora/core-tokenizer'

/**
 * typeof Paragraph
 */
export const ParagraphType = 'paragraph'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ParagraphType = typeof ParagraphType

/**
 * Paragraph represents a unit of discourse dealing with a particular point or idea.
 *
 * @example
 *    ````markdown
 *    Alpha bravo charlie.
 *    ````
 *    ==>
 *    ```js
 *    {
 *      type: 'paragraph',
 *      children: [{ type: 'text', value: 'Alpha bravo charlie.' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#paragraph
 * @see https://github.github.com/gfm/#paragraphs
 */
export interface Paragraph extends YastNode<ParagraphType>, YastParent {
  /**
   * Contents of paragraph.
   */
  children: PhrasingContent[]
}

/**
 * Middle state during the whole match and parse phase.
 */
export interface ParagraphState extends YastBlockState<ParagraphType> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: PhrasingContentLine[]
}
