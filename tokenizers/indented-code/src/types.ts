import type { Code, CodeType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = CodeType
export type INode = Code
export const uniqueName = '@yozora/tokenizer-indented-code'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: IPhrasingContentLine[]
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
