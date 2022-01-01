import type { HeadingType, IHeading } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentLine,
} from '@yozora/core-tokenizer'

export type T = HeadingType
export type INode = IHeading
export const uniqueName = '@yozora/tokenizer-setext-heading'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   * CodePoint of '-' / '='
   */
  marker: number
  /**
   * Contents
   */
  lines: ReadonlyArray<IPhrasingContentLine>
}

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
