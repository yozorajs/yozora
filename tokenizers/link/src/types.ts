import type { Link, LinkType } from '@yozora/ast'
import type { INodeInterval } from '@yozora/character'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = LinkType
export type INode = Link
export const uniqueName = '@yozora/tokenizer-link'

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
   * Link destination interval.
   */
  destinationContent?: INodeInterval
  /**
   * Link title interval.
   */
  titleContent?: INodeInterval
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
