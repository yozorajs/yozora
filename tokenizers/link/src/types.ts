import type { ILink, LinkType } from '@yozora/ast'
import type { INodeInterval } from '@yozora/character'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = LinkType
export type INode = ILink
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

export type IHookContext = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
