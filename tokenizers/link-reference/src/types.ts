import type {
  ILinkReference,
  IYastAssociation,
  IYastReference,
  LinkReferenceType,
} from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-link-reference'

export type T = LinkReferenceType
export type INode = ILinkReference

export interface IToken extends IPartialYastInlineToken<T>, IYastAssociation, IYastReference {}

export interface ILinkReferenceDelimiterBracket {
  /**
   * Start index of a bracket pair.
   */
  startIndex: number
  /**
   * End index of a bracket pair.
   */
  endIndex: number
  /**
   * Reference link label.
   */
  label?: string
  /**
   * Reference link identifier.
   */
  identifier?: string
}

export interface IDelimiter extends IYastTokenDelimiter {
  brackets: ILinkReferenceDelimiterBracket[]
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
