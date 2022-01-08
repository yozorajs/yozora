import type { EcmaImportType, IEcmaImport } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = EcmaImportType
export type INode = IEcmaImport
export const uniqueName = '@yozora/tokenizer-ecma-import'

export type IToken = IPartialYastBlockToken<T> & Omit<IEcmaImport, 'type'>

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
