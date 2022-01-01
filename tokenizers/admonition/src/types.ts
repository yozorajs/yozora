import type { AdmonitionType, IAdmonition } from '@yozora/ast'
import type { IBaseBlockTokenizerProps, IYastBlockToken } from '@yozora/core-tokenizer'
import type { IFencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = AdmonitionType
export type INode = IAdmonition
export const uniqueName = '@yozora/tokenizer-admonition'

export interface IToken extends IFencedBlockToken<T> {
  /**
   *
   */
  children?: IYastBlockToken[]
}

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
