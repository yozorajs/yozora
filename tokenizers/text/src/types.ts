import type { IText, TextType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = TextType
export type INode = IText
export const uniqueName = '@yozora/tokenizer-text'

export type IToken = IPartialYastInlineToken<T>

export interface IDelimiter extends IYastTokenDelimiter {
  type: 'full'
}

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
