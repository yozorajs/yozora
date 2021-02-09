import type {
  YastAssociation,
  YastNode,
  YastParent,
  YastReference,
} from '@yozora/tokenizercore'
import type {
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ReferenceLink
 */
export const ReferenceLinkType = 'referenceLink'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ReferenceLinkType = typeof ReferenceLinkType


/**
 * 通过关联关系来指定的超链接
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
 *        "type": "referenceLink",
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
export interface ReferenceLink extends
  YastAssociation,
  YastReference,
  YastParent,
  YastNode<ReferenceLinkType> { }


/**
 * A referenceLink token.
 */
export interface ReferenceLinkToken extends
  YastToken<ReferenceLinkType>,
  YastAssociation,
  YastReference { }


/**
 * Delimiter of ReferenceLinkToken.
 */
export interface ReferenceLinkTokenDelimiter extends YastTokenDelimiter {
    /**
     * Reference link label.
     */
    label?: string
    /**
     * Reference link identifier.
     */
    identifier?: string
  }
