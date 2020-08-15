import {
  DataNodeAssociation,
  DataNodeTokenPointDetail,
} from '@yozora/tokenizercore'
import {
  BlockDataNode,
  BlockDataNodeMetaData,
  BlockTokenizerMatchPhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof LinkDefinitionDataNode
 */
export const LinkDefinitionDataNodeType = 'LINK_DEFINITION'
export type LinkDefinitionDataNodeType = typeof LinkDefinitionDataNodeType


/**
 * data of LinkDefinitionDataNode
 *
 *  * @example
 *    ````markdown
 *    [Alpha]: https://example.com "title"
 *    ````
 *    ===>
 *    ```json
 *    {
 *      "type": "root",
        "meta": {
          "LINK_DEFINITION": {
            "foo": {
              "type": "LINK_DEFINITION",
              "identifier": "bravo",
              "label": "Bravo",
              "destination": "https://example.com",
              "title": "title"
            }
          }
        }
      }
 *    ```
 *
 * @see https://github.com/syntax-tree/mdast#definition
 */
export interface LinkDefinitionDataNode extends
  DataNodeAssociation,
  BlockDataNode<LinkDefinitionDataNodeType> {
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
 * State of match phase of LinkDefinitionTokenizer
 */
export interface LinkDefinitionMatchPhaseState
  extends BlockTokenizerMatchPhaseState<LinkDefinitionDataNodeType> {
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
 * Meta data of LinkDefinition
 */
export interface LinkDefinitionMetaData extends BlockDataNodeMetaData {
  /**
   * <label, LinkDefinitionDataNodeData>
   * Label is a trimmed and case-insensitive string
   */
  [label: string]: LinkDefinitionDataNode
}
