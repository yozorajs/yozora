import type { YastAssociation, YastNode, YastResource } from '@yozora/ast'
import type {
  PhrasingContentLine,
  YastBlockState,
} from '@yozora/core-tokenizer'
import type { LinkDestinationCollectingState } from '../util/link-destination'
import type { LinkLabelCollectingState } from '../util/link-label'
import type { LinkTitleCollectingState } from '../util/link-title'

/**
 * typeof Definition
 */
export const DefinitionType = 'definition'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type DefinitionType = typeof DefinitionType

/**
 * data of Definition
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
          "definition": {
            "foo": {
              "type": "definition",
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
 * @see https://github.github.com/gfm/#link-reference-definitions
 */
export interface Definition
  extends YastNode<DefinitionType>,
    YastAssociation,
    YastResource {}

/**
 * Middle state during the whole match and parse phase.
 */
export interface DefinitionState extends YastBlockState<DefinitionType> {
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
 * Meta data of Definition
 */
export type DefinitionMetaData = Record<
  string,
  Pick<Definition, 'identifier' | 'label' | 'url' | 'title'>
>
