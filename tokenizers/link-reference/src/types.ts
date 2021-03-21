import type { LinkReference, YastAssociation, YastReference } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-link-reference'
export type T = typeof uniqueName
export type Node = LinkReference

/**
 * A linkReference token.
 */
export interface Token extends YastToken<T>, YastAssociation, YastReference {}

/**
 * Delimiter of LinkReferenceToken.
 */
export interface Delimiter extends YastTokenDelimiter {
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
 * Params for constructing LinkReferenceTokenizer
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
