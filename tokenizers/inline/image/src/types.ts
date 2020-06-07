import { DataNodeAlternative, DataNodeResource } from '@yozora/tokenizercore'
import {
  InlineContentFragment,
  InlineDataNode,
  InlinePotentialToken,
  InlineTokenDelimiter,
  InlineTokenizerMatchPhaseState,
  InlineTokenizerParsePhaseState,
  InlineTokenizerPreMatchPhaseState,
} from '@yozora/tokenizercore-inline'


/**
 * typeof ImageDataNode
 */
export const ImageDataNodeType = 'IMAGE'
export type ImageDataNodeType = typeof ImageDataNodeType


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
export interface ImageDataNode extends
  DataNodeResource,
  DataNodeAlternative,
  InlineDataNode<ImageDataNodeType>,
  InlineTokenizerParsePhaseState<ImageDataNodeType> {

}


/**
 * Delimiter of ImageToken
 */
export interface ImageTokenDelimiter
  extends InlineTokenDelimiter<'opener' | 'closer'> {
  /**
   * link destination
   */
  destinationContents?: InlineContentFragment
  /**
   * link title
   */
  titleContents?: InlineContentFragment
}


/**
 * Potential token of Image
 */
export interface ImagePotentialToken
  extends InlinePotentialToken<ImageDataNodeType, ImageTokenDelimiter> {
  /**
   * link destination
   */
  destinationContents?: InlineContentFragment
  /**
   * link title
   */
  titleContents?: InlineContentFragment
  /**
   * Start/Left Delimiter of ImageToken
   */
  openerDelimiter: InlineTokenDelimiter<'opener'>
  /**
   * Middle Delimiter of ImageToken
   */
  middleDelimiter: InlineTokenDelimiter<'middle'>
  /**
   * End/Right Delimiter of ImageToken
   */
  closerDelimiter: InlineTokenDelimiter<'closer'>
  /**
   * Internal raw content fragments
   */
  innerRawContents: Exclude<InlinePotentialToken['innerRawContents'], undefined>
}


/**
 * State of pre-match phase of ImageTokenizer
 */
export interface ImagePreMatchPhaseState
  extends InlineTokenizerPreMatchPhaseState<ImageDataNodeType> {
  /**
   * link destination
   */
  destinationContents?: InlineContentFragment
  /**
   * link title
   */
  titleContents?: InlineContentFragment
  /**
   * Start/Left Delimiter of ImageToken
   */
  openerDelimiter: InlineTokenDelimiter<'opener'>
  /**
   * Middle Delimiter of ImageToken
   */
  middleDelimiter: InlineTokenDelimiter<'middle'>
  /**
   * End/Right Delimiter of ImageToken
   */
  closerDelimiter: InlineTokenDelimiter<'closer'>
}


/**
 * State of match phase of ImageTokenizer
 */
export interface ImageMatchPhaseState
  extends InlineTokenizerMatchPhaseState<ImageDataNodeType> {
  /**
   * link destination
   */
  destinationContents?: InlineContentFragment
  /**
   * link title
   */
  titleContents?: InlineContentFragment
  /**
   * Start/Left Delimiter of ImageToken
   */
  openerDelimiter: InlineTokenDelimiter<'opener'>
  /**
   * Middle Delimiter of ImageToken
   */
  middleDelimiter: InlineTokenDelimiter<'middle'>
  /**
   * End/Right Delimiter of ImageToken
   */
  closerDelimiter: InlineTokenDelimiter<'closer'>
}
