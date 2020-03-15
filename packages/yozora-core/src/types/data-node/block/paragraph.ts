import { BlockDataNodeType } from '../category'
import { DataNodePhrasingContent, DataNodeParent, BlockDataNode } from '../_base'


/**
 * data of ParagraphDataNode
 */
export interface ParagraphDataNodeData extends DataNodeParent {
  /**
   * 段落中的内容
   * contents of the paragraph
   */
  children: DataNodePhrasingContent[]
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
export type ParagraphDataNode = BlockDataNode<
  BlockDataNodeType.PARAGRAPH, ParagraphDataNodeData>
