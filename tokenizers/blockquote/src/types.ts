import type { BlockquoteType, IBlockquote } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'

export type T = BlockquoteType
export type INode = IBlockquote
export const uniqueName = '@yozora/tokenizer-blockquote'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   *
   */
  children: IYastBlockToken[]
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
