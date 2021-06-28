import type {
  FootnoteReference,
  FootnoteReferenceType,
  YastAssociation,
} from '@yozora/ast'
import type {
  BaseInlineTokenizerProps,
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

export type TokenizerProps = Partial<BaseInlineTokenizerProps>
