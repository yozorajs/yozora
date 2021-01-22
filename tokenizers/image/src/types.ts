import type { YastAlternative, YastResource } from '@yozora/tokenizercore'
import type {
  ContentFragment,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPostMatchPhaseState,
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
  YastInlineNode<ImageType>,
  InlineTokenizerParsePhaseState<ImageType> {

}


/**
 * State on match phase of ImageTokenizer
 */
export type ImageMatchPhaseState =
  & InlineTokenizerMatchPhaseState<ImageType>
  & ImageMatchPhaseStateData


/**
 * State on post-match phase of ImageTokenizer
 */
export type ImagePostMatchPhaseState =
  & InlineTokenizerPostMatchPhaseState<ImageType>
  & ImageMatchPhaseStateData


/**
 * State of match phase of ImageTokenizer
 */
export interface ImageMatchPhaseStateData {
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
