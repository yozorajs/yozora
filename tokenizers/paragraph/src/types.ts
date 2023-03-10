import type { Paragraph, ParagraphType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = ParagraphType
export type INode = Paragraph
export const uniqueName = '@yozora/tokenizer-paragraph'

export interface IToken extends IPartialBlockToken<T> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: Array<Readonly<IPhrasingContentLine>>
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
