import type {
  YastAlternative,
  YastAssociation,
  YastNode,
  YastReference,
  YastToken,
  YastTokenDelimiter,
} from '@yozora/tokenizercore'


/**
 * typeof ImageReference
 */
export const ImageReferenceType = 'ImageReference'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ImageReferenceType = typeof ImageReferenceType


/**
 * @example
 *    ````markdown
 *    ![alpha][bravo]
 *    ````
 *    ==>
 *    ```js
 *    {
 *      type: 'ImageReference',
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
export interface ImageReference extends
  YastNode<ImageReferenceType>,
  YastAssociation,
  YastReference,
  YastAlternative { }


/**
 * A ImageReference token.
 */
export interface ImageReferenceMatchPhaseState extends
  YastToken<ImageReferenceType>,
  YastAssociation,
  YastReference { }


/**
 * Delimiter of ImageReferenceToken.
 */
export interface ImageReferenceTokenDelimiter extends YastTokenDelimiter {
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
