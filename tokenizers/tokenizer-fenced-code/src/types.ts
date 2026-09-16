import type { Code, CodeType } from '@yozora/ast'
import type { IBaseBlockTokenizerProps } from '@yozora/tokenizer'
import type { IFencedBlockHookContext, IFencedBlockToken } from '@yozora/tokenizer-fenced-block'

export type T = CodeType
export type INode = Code
export const uniqueName = '@yozora/tokenizer-fenced-code'

export type IToken = IFencedBlockToken<T>

export type IThis = IFencedBlockHookContext<T>

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
