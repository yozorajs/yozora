import type { Footnote, FootnoteType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = FootnoteType
export type INode = Footnote
export const uniqueName = '@yozora/tokenizer-footnote'

export type IToken = IPartialInlineToken<T>

export interface IDelimiter extends ITokenDelimiter {
  /**
   * IDelimiter type.
   */
  type: 'opener' | 'closer'
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>
