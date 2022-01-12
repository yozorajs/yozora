import type { Text, TextType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = TextType
export type INode = Text
export const uniqueName = '@yozora/tokenizer-text'

export type IToken = IPartialYastInlineToken<T>

export interface IDelimiter extends IYastTokenDelimiter {
  type: 'full'
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
