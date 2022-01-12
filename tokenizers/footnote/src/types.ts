import type { Footnote, FootnoteType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  ITokenizer,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = FootnoteType
export type INode = Footnote
export const uniqueName = '@yozora/tokenizer-footnote'

export type IToken = IPartialYastInlineToken<T>

export interface IDelimiter extends IYastTokenDelimiter {
  /**
   * IDelimiter type.
   */
  type: 'opener' | 'closer'
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
