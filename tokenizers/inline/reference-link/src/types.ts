import type {
  DataNodeAssociation,
  DataNodeReference,
  DataNodeResource,
} from '@yozora/tokenizercore'
import type {
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ReferenceLinkDataNode
 */
export const ReferenceLinkDataNodeType = 'REFERENCE_LINK'
// eslint-disable-next-line @typescript-eslint/no-redeclare
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
 * Delimiter type of ReferenceLinkToken
 */
export enum ReferenceLinkDelimiterType {
  /**
   * potential reference link text
   */
  POTENTIAL_LINK_TEXT = 'potential-link-text',
  /**
   * potential reference link label
   */
  POTENTIAL_LINK_LABEL = 'potential-link-label',
  /**
   * Potential reference image collapsed part
   */
  POTENTIAL_COLLAPSED = 'potential-collapsed',
}


/**
 * Delimiter of ReferenceLinkToken
 */
export interface ReferenceLinkTokenDelimiter
  extends InlineTokenDelimiter<ReferenceLinkDelimiterType> {

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
 * State of match phase of ReferenceLinkTokenizer
 */
export interface ReferenceLinkMatchPhaseState extends
  DataNodeAssociation,
  DataNodeReference,
  InlineTokenizerMatchPhaseState<ReferenceLinkDataNodeType> {

}
