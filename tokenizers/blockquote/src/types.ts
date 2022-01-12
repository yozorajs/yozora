import type { Blockquote, BlockquoteType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  ITokenizer,
  IYastBlockToken,
} from '@yozora/core-tokenizer'

export type T = BlockquoteType
export type INode = Blockquote
export const uniqueName = '@yozora/tokenizer-blockquote'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   *
   */
  children: IYastBlockToken[]
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
