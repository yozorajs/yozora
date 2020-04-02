import { DataNode, DataNodeParent } from '@yozora/tokenizer-core'


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
 *      type: 'paragraph',
 *      children: [{ type: 'text', value: 'Alpha bravo charlie.' }]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#paragraph
 */
export type ParagraphDataNode = DataNode<ParagraphDataNodeType, ParagraphDataNodeData>
