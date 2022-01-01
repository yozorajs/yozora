import type { IYastAssociation, IYastNode } from '../ast'

export const FootnoteReferenceType = 'footnoteReference'
export type FootnoteReferenceType = typeof FootnoteReferenceType

/**
 * FootnoteReference represents a marker through association.
 *
 * Similar to imageReference and linkReference, the difference is that it has
 * only 'collapsed' reference type instead of 'full' and 'shortcut'
 * @see https://github.com/syntax-tree/mdast#footnotereference
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.com/syntax-tree/mdast#linkreference
 */
export interface IFootnoteReference
  extends IYastNode<FootnoteReferenceType>,
    IYastAssociation {}

/**
 * Example:
 *
 *    ````markdown
 *    ^[bravo]
 *
 *    [^bravo]: bravo and charlie.
 *    ````
 *
 * Yields:
 *
 *    ```json
 *    {
 *      "type": "footnoteReference",
 *      "identifier": "bravo",
 *      "label": "bravo"
 *    }
 *    ```
 */
