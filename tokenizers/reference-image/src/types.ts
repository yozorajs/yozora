import type {
  YastAlternative,
  YastAssociation,
  YastReference,
} from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ReferenceImage
 */
export const ReferenceImageType = 'referenceImage'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ReferenceImageType = typeof ReferenceImageType


/**
 * 图片引用
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
 * @see https://github.com/syntax-tree/mdast#imagereference
 */
export interface ReferenceImage extends
  YastAssociation,
  YastReference,
  YastAlternative,
  YastInlineNode<ReferenceImageType> {

}


/**
 * State on match phase of ReferenceImageTokenizer
 */
export interface ReferenceImageMatchPhaseState extends
  InlineTokenizerMatchPhaseState<ReferenceImageType>,
  YastAssociation,
  YastReference { }


/**
 * Delimiter of ReferenceImageToken
 */
export interface ReferenceImageTokenDelimiter extends InlineTokenDelimiter {
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
