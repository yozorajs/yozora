import type { Association, Node, Resource } from '../ast'

export const DefinitionType = 'definition'
export type DefinitionType = typeof DefinitionType

/**
 * Definition represents a resource.
 * @see https://github.com/syntax-tree/mdast#definition
 * @see https://github.github.com/gfm/#link-reference-definitions
 */
export interface Definition extends Node<DefinitionType>, Association, Resource {}

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
