import type { BlockquoteType, IBlockquote } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
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

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
