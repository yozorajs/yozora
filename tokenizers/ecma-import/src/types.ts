import type { EcmaImport, EcmaImportType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialBlockToken,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = EcmaImportType
export type INode = EcmaImport
export const uniqueName = '@yozora/tokenizer-ecma-import'

export type IToken = IPartialBlockToken<T> & Omit<EcmaImport, 'type'>

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
