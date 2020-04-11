import { BlockDataNode } from '@yozora/tokenizer-core'


/**
 * typeof ThematicBreakDataNode
 */
export const ThematicBreakDataNodeType = 'THEMATIC_BREAK'
export type ThematicBreakDataNodeType = typeof ThematicBreakDataNodeType


/**
 * data of ThematicBreakDataNode
 */
export interface ThematicBreakDataNodeData {

}


/**
 * 分割线
 * ThematicBreak (Node) represents a thematic break, such as a scene change in a story, a transition to another topic, or a new document.
 *
 * @example
 *    ````markdown
 *    ***
 *    ---
 *    ___
 *    ````
 *    ===>
 *    ```js
 *    [
 *      { type: 'THEMATIC_BREAK' },
 *      { type: 'THEMATIC_BREAK' },
 *      { type: 'THEMATIC_BREAK' }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#thematicbreak
 */
export type ThematicBreakDataNode = BlockDataNode<ThematicBreakDataNodeType, ThematicBreakDataNodeData>
