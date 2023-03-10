import type { Blockquote, BlockquoteType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IBlockToken,
  IPartialBlockToken,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = BlockquoteType
export type INode = Blockquote
export const uniqueName = '@yozora/tokenizer-blockquote'

export interface IToken extends IPartialBlockToken<T> {
  /**
   *
   */
  children: IBlockToken[]
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
