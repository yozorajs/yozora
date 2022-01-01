import type { CodeType, ICode } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentLine,
} from '@yozora/core-tokenizer'

export type T = CodeType
export type INode = ICode
export const uniqueName = '@yozora/tokenizer-indented-code'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   * Lines to construct the contents of a paragraph.
   */
  lines: IPhrasingContentLine[]
}

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
