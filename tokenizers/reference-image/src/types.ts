import type {
  YastAlternative,
  YastAssociation,
  YastReference,
  YastResource,
} from '@yozora/tokenizercore'
import type {
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ReferenceImage
 */
export const ReferenceImageType = 'REFERENCE_IMAGE'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ReferenceImageType = typeof ReferenceImageType


// key to access meta.LINK_DEFINITION
export const MetaKeyLinkDefinition = 'LINK_DEFINITION'
export type MetaLinkDefinitions = {
  [key: string]: YastAssociation & { destination: string, title?: string }
}


/**
 * 图片引用
 * @example
 *    ````markdown
 *    ![alpha][bravo]
 *    ````
 *    ==>
 *    ```js
 *    {
 *      type: 'REFERENCE_IMAGE',
 *      identifier: 'bravo',
 *      label: 'bravo',
 *      alt: 'alpha',
 *    }
 *    ```
 * @see https://github.com/syntax-tree/mdast#imagereference
 */
export interface ReferenceImage extends
  YastAssociation,
  YastReference,
  YastResource,
  YastAlternative,
  YastInlineNode<ReferenceImageType>,
  InlineTokenizerParsePhaseState<ReferenceImageType> {

}


/**
 * Delimiter type of ReferenceImageToken
 */
export enum ReferenceImageDelimiterType {
  /**
   * potential reference image description
   */
  POTENTIAL_IMAGE_DESCRIPTION = 'potential-image-description',
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
 * Delimiter of ReferenceImageToken
 */
export interface ReferenceImageTokenDelimiter
  extends InlineTokenDelimiter<ReferenceImageDelimiterType> {
  /**
   * Can it be parsed as image description
   */
  couldBeImageDescription: boolean
}


/**
 * Potential token of ReferenceImage
 */
export interface ReferenceImagePotentialToken extends
  YastAssociation,
  YastReference,
  InlinePotentialToken<ReferenceImageType, ReferenceImageTokenDelimiter> {

}


/**
 * State of match phase of ReferenceImageTokenizer
 */
export interface ReferenceImageMatchPhaseState extends
  YastAssociation,
  YastReference,
  InlineTokenizerMatchPhaseState<ReferenceImageType> {

}
