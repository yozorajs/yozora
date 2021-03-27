import type { Delete, DeleteType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = DeleteType
export type Node = Delete
export const uniqueName = '@yozora/tokenizer-delete'

export type Token = YastInlineToken<T>

export type Delimiter = YastTokenDelimiter

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
