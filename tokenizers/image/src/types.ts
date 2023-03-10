import type { Image, ImageType } from '@yozora/ast'
import type { INodeInterval } from '@yozora/character'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = ImageType
export type INode = Image
export const uniqueName = '@yozora/tokenizer-image'

/**
 * An image token.
 */
export interface IToken extends IPartialInlineToken<T> {
  /**
   * Link destination interval.
   */
  destinationContent?: INodeInterval
  /**
   * Link title interval.
   */
  titleContent?: INodeInterval
}

export interface IDelimiter extends ITokenDelimiter {
  /**
   * IDelimiter type.
   */
  type: 'opener' | 'closer'
  /**
   * link destination
   */
  destinationContent?: INodeInterval
  /**
   * link title
   */
  titleContent?: INodeInterval
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
