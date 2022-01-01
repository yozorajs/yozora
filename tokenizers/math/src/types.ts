import type { IMath, MathType } from '@yozora/ast'
import type { IBaseBlockTokenizerProps } from '@yozora/core-tokenizer'
import type { IFencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = MathType
export type INode = IMath
export const uniqueName = '@yozora/tokenizer-math'

export type IToken = IFencedBlockToken<T>

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
