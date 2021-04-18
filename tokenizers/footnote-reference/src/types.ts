import type {
  FootnoteReference,
  FootnoteReferenceType,
  YastAssociation,
} from '@yozora/ast'
import type {
  BaseTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-footnote-reference'

export type T = FootnoteReferenceType
export type Node = FootnoteReference

export interface Token extends PartialYastInlineToken<T>, YastAssociation {}

export interface Delimiter extends YastTokenDelimiter {
  type: 'full'
}

export interface TokenizerProps extends Partial<BaseTokenizerProps> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}
