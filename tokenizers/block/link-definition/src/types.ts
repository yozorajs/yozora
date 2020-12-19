import type {
  DataNodeAssociation,
  DataNodeTokenPointDetail,
  LinkDestinationCollectingState,
  LinkLabelCollectingState,
  LinkTitleCollectingState,
} from '@yozora/tokenizercore'
import type {
  BlockDataNode,
  BlockDataNodeMetaData,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPreMatchPhaseState,
  PhrasingContentLine,
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
 * State of pre-match phase of LinkDefinitionTokenizer
 */
export interface LinkDefinitionPreMatchPhaseState
  extends BlockTokenizerPreMatchPhaseState<LinkDefinitionDataNodeType> {
  /**
   *
   */
  lines: PhrasingContentLine[]
  /**
   * Link label
   * Trimmed, Case-Insensitive
   */
  label: LinkLabelCollectingState
  /**
   * Link destination
   */
  destination: LinkDestinationCollectingState | null
  /**
   * Link title
   */
  title: LinkTitleCollectingState | null
  /**
   * The line number of the first matched character of the link label
   */
  lineNoOfLabel: number
  /**
   * The line number of the first matched character of the link destination
   */
  lineNoOfDestination: number
  /**
   * The line number of the first matched character of the link title
   */
  lineNoOfTitle: number
  /**
   *
   */
  children?: undefined
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
  /**
   *
   */
  children?: undefined
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
