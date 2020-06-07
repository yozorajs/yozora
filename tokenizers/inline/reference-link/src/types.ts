import {
  DataNodeAssociation,
  DataNodeReference,
  DataNodeResource,
} from '@yozora/tokenizercore'
import {
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


// key to access meta.LINK_DEFINITION
export const MetaKeyLinkDefinition = 'LINK_DEFINITION'
export type MetaLinkDefinitions = {
  [key: string]: DataNodeAssociation & { destination: string, title?: string }
}


/**
 * 通过关联关系来指定的超链接
 * LinkReference represents a hyperlink through association, or its original
 * source if there is no association.
 *
 * @example
 *    ````markdown
 *    [alpha][Bravo]
 *
 *    [bravo]: #alpha
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "REFERENCE_LINK",
 *        "identifier": "bravo",
 *        "label": "Bravo",
 *        "referenceType": "full",
 *        "url": "#alpha",
 *        "title": "",
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
  DataNodeReference,
  DataNodeResource,
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
  extends InlineTokenDelimiter<'potential-link-text' | 'potential-link-label' | 'potential-collapsed'> {

}


/**
 * Potential token of ReferenceLink
 */
export interface ReferenceLinkPotentialToken extends
  DataNodeAssociation,
  DataNodeReference,
  InlinePotentialToken<ReferenceLinkDataNodeType, ReferenceLinkTokenDelimiter> {

}


/**
 * State of pre-match phase of ReferenceLinkTokenizer
 */
export interface ReferenceLinkPreMatchPhaseState extends
  DataNodeAssociation,
  DataNodeReference,
  InlineTokenizerPreMatchPhaseState<ReferenceLinkDataNodeType> {

}


/**
 * State of match phase of ReferenceLinkTokenizer
 */
export interface ReferenceLinkMatchPhaseState extends
  DataNodeAssociation,
  DataNodeReference,
  InlineTokenizerMatchPhaseState<ReferenceLinkDataNodeType> {

}