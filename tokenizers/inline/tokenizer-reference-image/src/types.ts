import {
  DataNodeAlternative,
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
 * typeof ReferenceImageDataNode
 */
export const ReferenceImageDataNodeType = 'REFERENCE_IMAGE'
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
 * Delimiter of ReferenceLinkToken
 */
export interface ReferenceImageTokenDelimiter
  extends InlineTokenDelimiter<'potential-image-description' | 'potential-link-label' | 'potential-collapsed'> {
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
 * State of pre-match phase of ReferenceImageTokenizer
 */
export interface ReferenceImagePreMatchPhaseState extends
  DataNodeAssociation,
  DataNodeReference,
  InlineTokenizerPreMatchPhaseState<ReferenceImageDataNodeType> {

}


/**
 * State of match phase of ReferenceImageTokenizer
 */
export interface ReferenceImageMatchPhaseState extends
  DataNodeAssociation,
  DataNodeReference,
  InlineTokenizerMatchPhaseState<ReferenceImageDataNodeType> {

}
