import type { AdmonitionType, IAdmonition } from '@yozora/ast'
import type { IBaseBlockTokenizerProps, IYastBlockToken } from '@yozora/core-tokenizer'
import type { IFencedBlockHookContext, IFencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = AdmonitionType
export type INode = IAdmonition
export const uniqueName = '@yozora/tokenizer-admonition'

export interface IToken extends IFencedBlockToken<T> {
  /**
   *
   */
  children?: IYastBlockToken[]
}

export type IThis = IFencedBlockHookContext<T>

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
