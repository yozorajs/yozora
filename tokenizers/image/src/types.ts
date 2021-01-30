import type {
  YastAlternative,
  YastNodeInterval,
  YastResource,
} from '@yozora/tokenizercore'
import type {
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Image
 */
export const ImageType = 'image'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ImageType = typeof ImageType


/**
 * 图片
 * Image represents an image.
 *
 * @example
 *    ````markdown
 *    ![alpha](https://example.com/favicon.ico "bravo")
 *    ````
 *    ===>
 *    ```json
 *    [
 *      {
 *        "type": "image",
 *        "url": "https://example.com/favicon.ico",
 *        "title": "bravo",
 *        "alt": "alpha"
 *      }
 *    ]
 *    ```
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 */
export interface Image extends
  YastResource,
  YastAlternative,
  YastInlineNode<ImageType> { }


/**
 * State on match phase of ImageTokenizer
 */
export interface ImageMatchPhaseState
  extends InlineTokenizerMatchPhaseState<ImageType> {
  /**
   * Link destination interval.
   */
  destinationContent?: YastNodeInterval
  /**
   * Link title interval.
   */
  titleContent?: YastNodeInterval
}


/**
 * Delimiter of ImageToken
 */
export interface ImageTokenDelimiter extends InlineTokenDelimiter {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer'
  /**
   * link destination
   */
  destinationContent?: YastNodeInterval
  /**
   * link title
   */
  titleContent?: YastNodeInterval
}
