import type { Text } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-text'
export type T = typeof uniqueName
export type Node = Text

/**
 * A text token.
 */
export type Token = YastToken<T>

/**
 * Delimiter of TextToken.
 */
export type Delimiter = YastTokenDelimiter

/**
 * Params for constructing TextTokenizer
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
