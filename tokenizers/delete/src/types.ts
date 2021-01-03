import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Delete
 */
export const DeleteType = 'DELETE'
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
export interface Delete extends
  YastInlineNode<DeleteType>,
  InlineTokenizerParsePhaseState<DeleteType> {
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
  extends InlinePotentialToken<DeleteType, DeleteTokenDelimiter> {
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
 * State of match phase of DeleteTokenizer
 */
export interface DeleteMatchPhaseState
  extends InlineTokenizerMatchPhaseState<DeleteType> {
  /**
   * Start/Left Delimiter of DeleteToken
   */
  openerDelimiter: DeleteTokenDelimiter
  /**
   * End/Right Delimiter of DeleteToken
   */
  closerDelimiter: DeleteTokenDelimiter
}
