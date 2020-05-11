import { BlockDataNode } from '@yozora/block-tokenizer-core'
import { DataNodeParent } from '@yozora/tokenizercore'


/**
 * typeof ParagraphDataNode
 */
export const ParagraphDataNodeType = 'PARAGRAPH'
export type ParagraphDataNodeType = typeof ParagraphDataNodeType


/**
 * data of ParagraphDataNode
 */
export interface ParagraphDataNodeData extends DataNodeParent {

}



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
export type ParagraphDataNode = BlockDataNode<ParagraphDataNodeType, ParagraphDataNodeData>
