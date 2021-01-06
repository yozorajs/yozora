import type {
  LinkDestinationCollectingState,
  LinkLabelCollectingState,
  LinkTitleCollectingState,
  YastAssociation,
} from '@yozora/tokenizercore'
import type {
  BlockTokenizerMatchPhaseState,
  BlockTokenizerMatchPhaseStateData,
  ClosedBlockTokenizerMatchPhaseState,
  PhrasingContentLine,
  YastBlockNode,
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
export interface LinkDefinition extends YastAssociation, YastBlockNode<LinkDefinitionType> {
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
 * State on match phase of LinkDefinitionTokenizer
 */
export type LinkDefinitionMatchPhaseState =
  & BlockTokenizerMatchPhaseState
  & LinkDefinitionMatchPhaseStateData


/**
 * Closed state on match phase of LinkDefinitionTokenizer
 */
export type ClosedLinkDefinitionMatchPhaseState =
  & ClosedBlockTokenizerMatchPhaseState
  & LinkDefinitionMatchPhaseStateData


/**
 * State data on match phase of LinkDefinitionTokenizer
 */
export interface LinkDefinitionMatchPhaseStateData
  extends BlockTokenizerMatchPhaseStateData<LinkDefinitionType> {
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
}


/**
 * Meta data of LinkDefinition
 */
export interface LinkDefinitionMetaData {
  /**
   * <label, LinkDefinitionData>
   * Label is a trimmed and case-insensitive string
   */
  [label: string]: LinkDefinition
}
