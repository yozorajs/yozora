import type {
  LinkDestinationCollectingState,
  LinkLabelCollectingState,
  LinkTitleCollectingState,
  YastAssociation,
  YastNodePoint,
} from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerPreMatchPhaseState,
  PhrasingContentLine,
  YastBlockNode,
  YastBlockNodeMeta,
} from '@yozora/tokenizercore-block'


/**
 * typeof LinkDefinition
 */
export const LinkDefinitionType = 'LINK_DEFINITION'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LinkDefinitionType = typeof LinkDefinitionType


/**
 * data of LinkDefinition
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
export interface LinkDefinition extends
  YastAssociation,
  YastBlockNode<LinkDefinitionType> {
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
  extends BlockTokenizerPreMatchPhaseState<LinkDefinitionType> {
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
  extends BlockTokenizerMatchPhaseState<LinkDefinitionType> {
  /**
   * Link label
   * Trimmed, Case-Insensitive
   */
  label: YastNodePoint[]
  /**
   * Link destination
   */
  destination: YastNodePoint[]
  /**
   * Link title
   */
  title?: YastNodePoint[]
  /**
   *
   */
  children?: undefined
}


/**
 * Meta data of LinkDefinition
 */
export interface LinkDefinitionMetaData extends YastBlockNodeMeta {
  /**
   * <label, LinkDefinitionData>
   * Label is a trimmed and case-insensitive string
   */
  [label: string]: LinkDefinition
}
