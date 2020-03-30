import { DataNode, DataNodeParent } from '@yozora/tokenizer-core'


/**
 * typeof EmphasisDataNode
 */
export const EmphasisDataNodeType = 'EMPHASIS'
export type EmphasisDataNodeType = typeof EmphasisDataNodeType

/**
 * typeof Strong EmphasisDataNode
 */
export const StrongEmphasisDataNodeType = 'STRONG'
export type StrongEmphasisDataNodeType = typeof StrongEmphasisDataNodeType


/**
 * data of EmphasisDataNode
 */
export interface EmphasisDataNodeData extends DataNodeParent {

}


/**
 * 斜体；强调的内容
 * Emphasis represents stress emphasis of its contents.
 *
 * @example
 *    ````markdown
 *    *alpha* _bravo_ **alpha** __bravo__
 *    ````
 *    ===>
 *    ```js
 *    {
 *      type: 'PARAGRAPH',
 *      children: [
 *        {
 *          type: 'EMPHASIS',
 *          children: [{ type: 'TEXT', value: 'alpha' }]
 *        },
 *        { type: 'TEXT', value: ' ' },
 *        {
 *          type: 'EMPHASIS',
 *          children: [{ type: 'TEXT', value: 'bravo' }]
 *        },
 *        {
 *          type: 'STRONG',
 *          children: [{ type: 'TEXT', value: 'alpha' }]
 *        },
 *        { type: 'TEXT', value: ' ' },
 *        {
 *          type: 'STRONG',
 *          children: [{ type: 'TEXT', value: 'bravo' }]
 *        }
 *      ]
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export type EmphasisDataNode = DataNode<
  EmphasisDataNodeType | StrongEmphasisDataNodeType,
  EmphasisDataNodeData
>
