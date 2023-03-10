import type { Delete, DeleteType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = DeleteType
export type INode = Delete
export const uniqueName = '@yozora/tokenizer-delete'

export type IToken = IPartialInlineToken<T>

export type IDelimiter = ITokenDelimiter

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
