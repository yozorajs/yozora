import { InlineDataNodeType } from '../category'
import { DataNodePhrasingContent, DataNodeParent, InlineDataNode } from '../_base'


/**
 * data of EmphasisDataNode
 */
export interface EmphasisDataNodeData extends DataNodeParent {
  /**
   * 内联数据或者文本内容
   */
  children: DataNodePhrasingContent[]
}


/**
 * 斜体；强调的内容
 * Emphasis represents stress emphasis of its contents.
 *
 * @example
 *    ````markdown
 *    *alpha* _bravo_
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'paragraph',
 *      children: [
 *        {
 *          type: 'emphasis',
 *          children: [{ type: 'text', value: 'alpha' }]
 *        },
 *        { type: 'text', value: ' ' },
 *        {
 *          type: 'emphasis',
 *          children: [{ type: 'text', value: 'bravo' }]
 *        }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export type EmphasisDataNode = InlineDataNode<
  InlineDataNodeType.EMPHASIS, EmphasisDataNodeData>
