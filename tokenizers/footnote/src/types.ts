import type { FootnoteType, IFootnote } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialYastInlineToken,
  IYastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = FootnoteType
export type INode = IFootnote
export const uniqueName = '@yozora/tokenizer-footnote'

export type IToken = IPartialYastInlineToken<T>

export interface IDelimiter extends IYastTokenDelimiter {
  /**
   * IDelimiter type.
   */
  type: 'opener' | 'closer'
}

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
