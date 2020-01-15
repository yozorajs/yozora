import { DataNodePhrasingContent, DataNodeParent } from '../_base'
import { BlockDataNode, BlockDataNodeType } from './_base'


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
export interface ParagraphDataNode
  extends BlockDataNode<BlockDataNodeType.PARAGRAPH>, DataNodeParent {
  /**
   * 段落中的内容
   * contents of the paragraph
   */
  children: DataNodePhrasingContent[]
}
