import {
  DataNodeAssociation,
  DataNodeTokenPointDetail,
} from '@yozora/tokenizercore'
import {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof LinkReferenceDefinitionDataNode
 */
export const LinkReferenceDefinitionDataNodeType = 'LINK_REFERENCE_DEFINITION'
export type LinkReferenceDefinitionDataNodeType = typeof LinkReferenceDefinitionDataNodeType


/**
 * data of LinkReferenceDefinitionDataNode
 * @see https://github.com/syntax-tree/mdast#definition
 */
export interface LinkReferenceDefinitionDataNode extends
  DataNodeAssociation,
  BlockDataNode<LinkReferenceDefinitionDataNodeType> {
  /**
   * Link destination
   */
  destination: string
  /**
   * Link title
   */
  title?: string
}


/**
 * State of match phase of LinkReferenceDefinitionTokenizer
 */
export interface LinkReferenceDefinitionMatchPhaseState
  extends BlockTokenizerMatchPhaseState<LinkReferenceDefinitionDataNodeType> {
  /**
   * Link label
   * Trimmed, Case-Insensitive
   */
  label: DataNodeTokenPointDetail[]
  /**
   * Link destination
   */
  destination: DataNodeTokenPointDetail[]
  /**
   * Link title
   */
  title?: DataNodeTokenPointDetail[]
}


/**
 * Meta data of LinkReferenceDefinition
 */
export interface LinkReferenceDefinitionMetaData {
  /**
   * <label, LinkReferenceDefinitionDataNodeData>
   * Label is a trimmed and case-insensitive string
   */
  [label: string]: LinkReferenceDefinitionDataNode
}
