import type { IImage, ImageType } from '@yozora/ast'
import type { INodeInterval } from '@yozora/character'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = ImageType
export type INode = IImage
export const uniqueName = '@yozora/tokenizer-image'

/**
 * An image token.
 */
export interface IToken extends IPartialYastInlineToken<T> {
  /**
   * Link destination interval.
   */
  destinationContent?: INodeInterval
  /**
   * Link title interval.
   */
  titleContent?: INodeInterval
}

export interface IDelimiter extends IYastTokenDelimiter {
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
