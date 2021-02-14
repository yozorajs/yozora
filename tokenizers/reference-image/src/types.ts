import type {
  YastAlternative,
  YastAssociation,
  YastNode,
  YastReference,
} from '@yozora/tokenizercore'
import type {
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ReferenceImage
 */
export const ReferenceImageType = 'referenceImage'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ReferenceImageType = typeof ReferenceImageType


/**
 * @example
 *    ````markdown
 *    ![alpha][bravo]
 *    ````
 *    ==>
 *    ```js
 *    {
 *      type: 'referenceImage',
 *      identifier: 'bravo',
 *      label: 'bravo',
 *      referenceType: 'full',
 *      alt: 'alpha',
 *    }
 *    ```
 *
 * @see https://github.github.com/gfm/#images
 * @see https://github.com/syntax-tree/mdast#imagereference
 */
export interface ReferenceImage extends
  YastAssociation,
  YastReference,
  YastAlternative,
  YastNode<ReferenceImageType> { }


/**
 * A referenceImage token.
 */
export interface ReferenceImageMatchPhaseState extends
  YastToken<ReferenceImageType>,
  YastAssociation,
  YastReference { }


/**
 * Delimiter of ReferenceImageToken.
 */
export interface ReferenceImageTokenDelimiter extends YastTokenDelimiter {
  type: 'opener' | 'closer'
  /**
   * Reference link label.
   */
  label?: string
  /**
   * Reference link identifier.
   */
  identifier?: string
}
