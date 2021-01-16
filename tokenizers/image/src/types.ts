import type { YastAlternative, YastResource } from '@yozora/tokenizercore'
import type {
  ContentFragment,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  YastInlineNode,
} from '@yozora/tokenizercore-inline'


/**
 * typeof Image
 */
export const ImageType = 'IMAGE'
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
 *        "type": "IMAGE",
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
  YastInlineNode<ImageType>,
  InlineTokenizerParsePhaseState<ImageType> {

}


/**
 * Delimiter of ImageToken
 */
export interface ImageTokenDelimiter extends InlineTokenDelimiter {
  /**
   * link destination
   */
  destinationContents?: ContentFragment
  /**
   * link title
   */
  titleContents?: ContentFragment
}


/**
 * Potential token of Image
 */
export interface ImagePotentialToken
  extends InlinePotentialToken<ImageType, ImageTokenDelimiter> {
  /**
   * link destination
   */
  destinationContents?: ContentFragment
  /**
   * link title
   */
  titleContents?: ContentFragment
  /**
   * Start/Left Delimiter of ImageToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * Middle Delimiter of ImageToken
   */
  middleDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of ImageToken
   */
  closerDelimiter: InlineTokenDelimiter
  /**
   * Internal raw content fragments
   */
  innerRawContents: Exclude<InlinePotentialToken['innerRawContents'], undefined>
}


/**
 * State of match phase of ImageTokenizer
 */
export interface ImageMatchPhaseState
  extends InlineTokenizerMatchPhaseState<ImageType> {
  /**
   * link destination
   */
  destinationContents?: ContentFragment
  /**
   * link title
   */
  titleContents?: ContentFragment
  /**
   * Start/Left Delimiter of ImageToken
   */
  openerDelimiter: InlineTokenDelimiter
  /**
   * Middle Delimiter of ImageToken
   */
  middleDelimiter: InlineTokenDelimiter
  /**
   * End/Right Delimiter of ImageToken
   */
  closerDelimiter: InlineTokenDelimiter
}
