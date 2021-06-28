import type {
  ImageReference,
  ImageReferenceType,
  YastAssociation,
  YastReference,
} from '@yozora/ast'
import type {
  BaseInlineTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'
import type { LinkReferenceDelimiterBracket } from '@yozora/tokenizer-link-reference'

export const uniqueName = '@yozora/tokenizer-image-reference'

export type T = ImageReferenceType
export type Node = ImageReference

export interface Token
  extends PartialYastInlineToken<T>,
    YastAssociation,
    YastReference {}

export interface Delimiter extends YastTokenDelimiter {
  brackets: LinkReferenceDelimiterBracket[]
}

export type TokenizerProps = Partial<BaseInlineTokenizerProps>
