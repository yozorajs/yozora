import { DataNodeAssociation } from '@yozora/tokenizercore'
import {
  InlineContentFragment,
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ReferenceLinkDataNode
 */
export const ReferenceLinkDataNodeType = 'REFERENCE_LINK'
export type ReferenceLinkDataNodeType = typeof ReferenceLinkDataNodeType


/**
 * 通过关联关系来指定的超链接
 * LinkReference represents a hyperlink through association, or its original
 * source if there is no association.
 *
 * @example
 *    ````markdown
 *    [alpha][Bravo]
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "REFERENCE_LINK",
 *        "identifier": "bravo",
 *        "label": "Bravo",
 *        "children": [
 *          {
 *            "type": "TEXT",
 *            "value": "alpha"
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export interface ReferenceLinkDataNode extends
  DataNodeAssociation,
  InlineDataNode<ReferenceLinkDataNodeType>,
  InlineTokenizerParsePhaseState<ReferenceLinkDataNodeType> {
  /**
   *
   */
  children: Exclude<InlineTokenizerParsePhaseState['children'], undefined>
}


/**
 * Delimiter of ReferenceLinkToken
 */
export interface ReferenceLinkTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'closer'> {
  /**
   * link label
   */
  labelContents?: InlineContentFragment
}


/**
 * Potential token of ReferenceLink
 */
export interface ReferenceLinkPotentialToken
  extends InlinePotentialToken<ReferenceLinkDataNodeType, ReferenceLinkTokenDelimiter> {
  /**
   * link label
   */
  labelContents: InlineContentFragment
  /**
   * Start/Left Delimiter of ReferenceLinkToken
   */
  openerDelimiter: InlineTokenDelimiter<'opener'>
  /**
   * Middle Delimiter of ReferenceLinkToken
   */
  middleDelimiter: InlineTokenDelimiter<'middle'>
  /**
   * End/Right Delimiter of ReferenceLinkToken
   */
  closerDelimiter: InlineTokenDelimiter<'closer'>
  /**
   * Internal raw content fragments
   */
  innerRawContents: Exclude<InlinePotentialToken['innerRawContents'], undefined>
}


/**
 * State of pre-match phase of ReferenceLinkTokenizer
 */
export interface ReferenceLinkPreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<ReferenceLinkDataNodeType> {
  /**
   * link label
   */
  labelContents: InlineContentFragment
  /**
   * Start/Left Delimiter of ReferenceLinkToken
   */
  openerDelimiter: InlineTokenDelimiter<'opener'>
  /**
   * Middle Delimiter of ReferenceLinkToken
   */
  middleDelimiter: InlineTokenDelimiter<'middle'>
  /**
   * End/Right Delimiter of ReferenceLinkToken
   */
  closerDelimiter: InlineTokenDelimiter<'closer'>
}


/**
 * State of match phase of ReferenceLinkTokenizer
 */
export interface ReferenceLinkMatchPhaseState
  extends InlineTokenizerMatchPhaseState<ReferenceLinkDataNodeType> {
  /**
   * link label
   */
  labelContents: InlineContentFragment
  /**
   * Start/Left Delimiter of ReferenceLinkToken
   */
  openerDelimiter: InlineTokenDelimiter<'opener'>
  /**
   * Middle Delimiter of ReferenceLinkToken
   */
  middleDelimiter: InlineTokenDelimiter<'middle'>
  /**
   * End/Right Delimiter of ReferenceLinkToken
   */
  closerDelimiter: InlineTokenDelimiter<'closer'>
}
