import type {
  ImageReference,
  ImageReferenceType,
  YastAssociation,
  YastReference,
} from '@yozora/ast'
import type {
  BaseTokenizerProps,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = ImageReferenceType
export type Node = ImageReference
export const uniqueName = '@yozora/tokenizer-image-reference'

export interface Token
  extends YastInlineToken<T>,
    YastAssociation,
    YastReference {}

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

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
