import type { NodeInterval } from '@yozora/character'
import type {
  YastAlternative,
  YastNode,
  YastResource,
} from '@yozora/tokenizercore'
import type {
  YastToken,
  YastTokenDelimiter,
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
  YastNode<ImageType> { }


/**
 * An image token.
 */
export interface ImageToken extends YastToken<ImageType> {
  /**
   * Link destination interval.
   */
  destinationContent?: NodeInterval
  /**
   * Link title interval.
   */
  titleContent?: NodeInterval
}


/**
 * Delimiter of ImageToken.
 */
export interface ImageTokenDelimiter extends YastTokenDelimiter {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer'
  /**
   * link destination
   */
  destinationContent?: NodeInterval
  /**
   * link title
   */
  titleContent?: NodeInterval
}
