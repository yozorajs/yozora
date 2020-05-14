import { BlockDataNode } from '@yozora/tokenizercore-block'


/**
 * typeof LinkReferenceDefinitionDataNode
 */
export const LinkReferenceDefinitionDataNodeType = 'LINK_REFERENCE_DEFINITION'
export type LinkReferenceDefinitionDataNodeType = typeof LinkReferenceDefinitionDataNodeType


/**
 * data of LinkReferenceDefinitionDataNode
 */
export interface LinkReferenceDefinitionDataNode extends
  BlockDataNode<LinkReferenceDefinitionDataNodeType> {
  /**
   * Link label
   * Trimmed, Case-Insensitive
   */
  label: string
  /**
   * Link destination
   */
  destination: string
  /**
   * Link title
   */
  title?: string
}
