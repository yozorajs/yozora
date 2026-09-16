import type { Math as MathNode, MathType } from '@yozora/ast'
import type { IBaseBlockTokenizerProps } from '@yozora/tokenizer'
import type { IFencedBlockHookContext, IFencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = MathType
export type INode = MathNode
export const uniqueName = '@yozora/tokenizer-math'

export type IToken = IFencedBlockToken<T>

export type IThis = IFencedBlockHookContext<T>

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
