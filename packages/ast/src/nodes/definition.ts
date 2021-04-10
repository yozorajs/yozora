import type { YastAssociation, YastNode, YastResource } from '../ast'

export const DefinitionType = 'definition'
export type DefinitionType = typeof DefinitionType

/**
 * Definition represents a resource.
 * @see https://github.com/syntax-tree/mdast#definition
 * @see https://github.github.com/gfm/#link-reference-definitions
 */
export interface Definition
  extends YastNode<DefinitionType>,
    YastAssociation,
    YastResource {}

/**
 * Definition map:
 *  - key: definition.identifier
 *  - value: { type, ...value } = definition
 */
export type DefinitionMap = Record<string, Omit<Definition, 'type'>>

/**
 * Example:
 *
 *    ````markdown
 *    [Alpha]: https://example.com "title"
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "definition",
 *      "identifier": "bravo",
 *      "label": "Bravo",
 *      "url": "https://example.com",
 *      "title": "title"
 *    }
 *    ```
 */
