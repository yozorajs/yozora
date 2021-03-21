import type { YastAssociation, YastParent, YastReference } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

/**
 * typeof LinkReference
 */
export const LinkReferenceType = 'linkReference'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type LinkReferenceType = typeof LinkReferenceType

/**
 * LinkReference represents a hyperlink through association, or its original
 * source if there is no association.
 *
 * @example
 *    ````markdown
 *    [alpha][Bravo]
 *
 *    [bravo]: #alpha
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "linkReference",
 *        "identifier": "bravo",
 *        "label": "Bravo",
 *        "referenceType": "full",
 *        "children": [
 *          {
 *            "type": "text",
 *            "value": "alpha"
 *          }
 *        ]
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export interface LinkReference
  extends YastParent<LinkReferenceType>,
    YastAssociation,
    YastReference {}

/**
 * A linkReference token.
 */
export interface LinkReferenceToken
  extends YastToken<LinkReferenceType>,
    YastAssociation,
    YastReference {}

/**
 * Delimiter of LinkReferenceToken.
 */
export interface LinkReferenceTokenDelimiter extends YastTokenDelimiter {
  /**
   * Reference link label.
   */
  label?: string
  /**
   * Reference link identifier.
   */
  identifier?: string
}
