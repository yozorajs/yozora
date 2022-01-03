import type { IParagraph, ParagraphType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = ParagraphType
export type INode = IParagraph
export const uniqueName = '@yozora/tokenizer-paragraph'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: Array<Readonly<IPhrasingContentLine>>
}

export type IHookContext = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
