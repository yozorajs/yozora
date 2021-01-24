import type {
  YastAssociation,
  YastParent,
  YastReference,
} from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ReferenceLink
 */
export const ReferenceLinkType = 'referenceLink'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ReferenceLinkType = typeof ReferenceLinkType


// key to access meta.linkDefinition
export const MetaKeyLinkDefinition = 'linkDefinition'
export type MetaLinkDefinitions = {
  [key: string]: YastAssociation & { destination: string, title?: string }
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
 *        "type": "referenceLink",
 *        "identifier": "bravo",
 *        "label": "Bravo",
 *        "referenceType": "full",
 *        "children": [
 *          {
 *            "type": "text",
 *            "value": "alpha"
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export interface ReferenceLink extends
  YastAssociation, YastReference, YastInlineNode<ReferenceLinkType> {

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
 * State on match phase of ReferenceLinkTokenizer
 */
export type ReferenceLinkMatchPhaseState =
  & InlineTokenizerMatchPhaseState<ReferenceLinkType>
  & ReferenceLinkMatchPhaseStateData


/**
 * State on post-match phase of ReferenceLinkTokenizer
 */
export type ReferenceLinkPostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<ReferenceLinkType>
  & ReferenceLinkMatchPhaseStateData


/**
 * State of match phase of ReferenceLinkTokenizer
 */
export interface ReferenceLinkMatchPhaseStateData extends YastAssociation, YastReference {

}


/**
 * Delimiter of ReferenceLinkToken.
 */
export interface ReferenceLinkTokenDelimiter extends InlineTokenDelimiter {
  /**
   * Delimiter type.
   */
  type: ReferenceLinkDelimiterType
  /**
   * Whether this delimiter may contain other links.
   */
  couldHasInnerLinks: boolean
}
