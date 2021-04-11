import type {
  LinkReference,
  LinkReferenceType,
  YastAssociation,
  YastReference,
} from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-link-reference'

export type T = LinkReferenceType
export type Node = LinkReference

export interface Token
  extends PartialYastInlineToken<T>,
    YastAssociation,
    YastReference {}

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

export interface TokenizerProps extends Partial<BaseTokenizerProps> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
