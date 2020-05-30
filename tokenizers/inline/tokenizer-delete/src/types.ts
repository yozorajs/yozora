import {
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof DeleteDataNode
 */
export const DeleteDataNodeType = 'DELETE'
export type DeleteDataNodeType = typeof DeleteDataNodeType


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
 *        "type": "DELETE",
 *        "children": [
 *          {
 *            "type": "TEXT",
 *            "value": "alpha"
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#delete
 */
export interface DeleteDataNode extends
  InlineDataNode<DeleteDataNodeType>,
  InlineTokenizerParsePhaseState<DeleteDataNodeType> {
  /**
   *
   */
  children: Exclude<InlineTokenizerParsePhaseState['children'], undefined>
}


/**
 * Delimiter of DeleteToken
 */
export interface DeleteTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'both' | 'closer'> {

}


/**
 * Potential token of Delete
 */
export interface DeletePotentialToken
  extends InlinePotentialToken<DeleteDataNodeType, DeleteTokenDelimiter> {
  /**
   * Start/Left Delimiter of DeleteToken
   */
  openerDelimiter: DeleteTokenDelimiter
  /**
   * End/Right Delimiter of DeleteToken
   */
  closerDelimiter: DeleteTokenDelimiter
  /**
   * Internal raw content fragments
   */
  innerRawContents: Exclude<InlinePotentialToken['innerRawContents'], undefined>
}


/**
 * State of pre-match phase of DeleteTokenizer
 */
export interface DeletePreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<DeleteDataNodeType> {
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
 * State of match phase of DeleteTokenizer
 */
export interface DeleteMatchPhaseState
  extends InlineTokenizerMatchPhaseState<DeleteDataNodeType> {
  /**
   * Start/Left Delimiter of DeleteToken
   */
  openerDelimiter: DeleteTokenDelimiter
  /**
   * End/Right Delimiter of DeleteToken
   */
  closerDelimiter: DeleteTokenDelimiter
}
