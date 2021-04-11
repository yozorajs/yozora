import type { Math, MathType } from '@yozora/ast'
import type { BaseTokenizerProps } from '@yozora/core-tokenizer'
import type { FencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = MathType
export type Node = Math
export const uniqueName = '@yozora/tokenizer-math'

export type Token = FencedBlockToken<T>

export type TokenizerProps = Partial<BaseTokenizerProps>
