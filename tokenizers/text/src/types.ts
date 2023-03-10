import type { Text, TextType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = TextType
export type INode = Text
export const uniqueName = '@yozora/tokenizer-text'

export type IToken = IPartialInlineToken<T>

export interface IDelimiter extends ITokenDelimiter {
  type: 'full'
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
