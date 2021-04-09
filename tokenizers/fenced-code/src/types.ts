import type { Code, CodeType } from '@yozora/ast'
import type { BaseTokenizerProps } from '@yozora/core-tokenizer'
import type { FencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = CodeType
export type Node = Code
export const uniqueName = '@yozora/tokenizer-fenced-code'

export type Token = FencedBlockToken<T>

export type TokenizerProps = Omit<BaseTokenizerProps, 'name'>
