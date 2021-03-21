import type {
  ImageReference,
  YastAssociation,
  YastReference,
} from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-image-reference'
export type T = typeof uniqueName
export type Node = ImageReference

/**
 * A ImageReference token.
 */
export interface Token extends YastToken<T>, YastAssociation, YastReference {}

/**
 * Delimiter of ImageReferenceToken.
 */
export interface Delimiter extends YastTokenDelimiter {
  type: 'opener' | 'closer'
  /**
   * Reference link label.
   */
  label?: string
  /**
   * Reference link identifier.
   */
  identifier?: string
}

/**
 * Params for constructing ImageReferenceTokenizer
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
