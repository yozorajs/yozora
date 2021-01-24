import type { YastParent } from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Delete
 */
export const DeleteType = 'delete'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DeleteType = typeof DeleteType


/**
 * 删除线
 * Delete represents contents that are no longer accurate or no longer relevant.
 *
 * @example
 *    ````markdown
 *    ~~alpha~~
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "delete",
 *        "children": [
 *          { "type": "text", "value": "alpha" }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#delete
 */
export interface Delete extends
  YastInlineNode<DeleteType>, YastParent<YastInlineNode> {

}


/**
 * State on match phase of DeleteTokenizer
 */
export type DeleteMatchPhaseState =
  & InlineTokenizerMatchPhaseState<DeleteType>
  & DeleteMatchPhaseStateData


/**
 * State on post-match phase of DeleteTokenizer
 */
export type DeletePostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<DeleteType>
  & DeleteMatchPhaseStateData


/**
 * State data on match phase of DeleteTokenizer
 */
export interface DeleteMatchPhaseStateData {
  /**
   * Start/Left Delimiter of DeleteToken
   */
  openerDelimiter: DeleteTokenDelimiter
  /**
   * End/Right Delimiter of DeleteToken
   */
  closerDelimiter: DeleteTokenDelimiter
}


/**
 * Delimiter of DeleteToken
 */
export interface DeleteTokenDelimiter extends InlineTokenDelimiter {

}
