import type {
  YastAssociation,
  YastReference,
  YastResource,
} from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPostMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ReferenceLink
 */
export const ReferenceLinkType = 'REFERENCE_LINK'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ReferenceLinkType = typeof ReferenceLinkType


// key to access meta.LINK_DEFINITION
export const MetaKeyLinkDefinition = 'LINK_DEFINITION'
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
export interface ReferenceLink extends
  YastAssociation,
  YastReference,
  YastResource,
  YastInlineNode<ReferenceLinkType>,
  InlineTokenizerParsePhaseState<ReferenceLinkType> {
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
}
