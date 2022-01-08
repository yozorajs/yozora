import type { DeleteType, IDelete } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = DeleteType
export type INode = IDelete
export const uniqueName = '@yozora/tokenizer-delete'

export type IToken = IPartialYastInlineToken<T>

export type IDelimiter = IYastTokenDelimiter

export type IHookContext = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
