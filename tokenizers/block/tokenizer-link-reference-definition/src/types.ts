/**
 * typeof LinkReferenceDefinitionDataNode
 */
export const LinkReferenceDefinitionDataNodeType = 'LINK_REFERENCE_DEFINITION'
export type LinkReferenceDefinitionDataNodeType = typeof LinkReferenceDefinitionDataNodeType


/**
 * data of LinkReferenceDefinitionDataNode
 */
export interface LinkReferenceDefinitionDataNodeData {
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
