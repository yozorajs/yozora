import type { YastParent } from '../ast'

export const FootnoteDefinitionType = 'footnoteDefinition'
export type FootnoteDefinitionType = typeof FootnoteDefinitionType

/**
 * FootnoteDefinition represents content relating to the document that is
 * outside its flow.
 * @see https://github.com/syntax-tree/mdast#footnotedefinition
 */
export type FootnoteDefinition = YastParent<FootnoteDefinitionType>

/**
 * Example:
 *
 *    ````markdown
 *    [^Bravo]: bravo and charlie.
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "footnoteDefinition",
 *      "identifier": "bravo",
 *      "label": "Bravo",
 *      "children": [
 *        {
 *          "type": "text",
 *          "value": "bravo and charlie."
 *        }
 *      ]
 *    }
 *    ```
 */
