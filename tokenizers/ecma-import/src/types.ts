import type { EcmaImport, EcmaImportType } from '@yozora/ast'
import type {
  BaseBlockTokenizerProps,
  PartialYastBlockToken,
} from '@yozora/core-tokenizer'

export type T = EcmaImportType
export type Node = EcmaImport
export const uniqueName = '@yozora/tokenizer-ecma-import'

export type Token = PartialYastBlockToken<T> & Omit<EcmaImport, 'type'>
export type TokenizerProps = Partial<BaseBlockTokenizerProps>
