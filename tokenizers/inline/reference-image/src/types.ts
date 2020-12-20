import type {
  DataNodeAlternative,
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
 * typeof ReferenceImageDataNode
 */
export const ReferenceImageDataNodeType = 'REFERENCE_IMAGE'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ReferenceImageDataNodeType = typeof ReferenceImageDataNodeType


// key to access meta.LINK_DEFINITION
export const MetaKeyLinkDefinition = 'LINK_DEFINITION'
export type MetaLinkDefinitions = {
  [key: string]: DataNodeAssociation & { destination: string, title?: string }
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
export interface ReferenceImageDataNode extends
  DataNodeAssociation,
  DataNodeReference,
  DataNodeResource,
  DataNodeAlternative,
  InlineDataNode<ReferenceImageDataNodeType>,
  InlineTokenizerParsePhaseState<ReferenceImageDataNodeType> {

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
  DataNodeAssociation,
  DataNodeReference,
  InlinePotentialToken<ReferenceImageDataNodeType, ReferenceImageTokenDelimiter> {

}


/**
 * State of match phase of ReferenceImageTokenizer
 */
export interface ReferenceImageMatchPhaseState extends
  DataNodeAssociation,
  DataNodeReference,
  InlineTokenizerMatchPhaseState<ReferenceImageDataNodeType> {

}
