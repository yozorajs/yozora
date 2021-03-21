import type { Delete } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-delete'
export type T = typeof uniqueName
export type Node = Delete

/**
 * A delete token.
 */
export type Token = YastToken<T>

/**
 * Delimiter of DeleteToken.
 */
export type Delimiter = YastTokenDelimiter

/**
 * Params for constructing DeleteTokenizer
 */
export interface TokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
}
