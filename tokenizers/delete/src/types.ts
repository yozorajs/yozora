import type { Delete, DeleteType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = DeleteType
export type INode = Delete
export const uniqueName = '@yozora/tokenizer-delete'

export type IToken = IPartialYastInlineToken<T>

export type IDelimiter = IYastTokenDelimiter

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
