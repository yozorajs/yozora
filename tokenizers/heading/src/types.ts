import type { HeadingType, IHeading } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentLine,
} from '@yozora/core-tokenizer'

export type T = HeadingType
export type INode = IHeading
export const uniqueName = '@yozora/tokenizer-heading'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   * Level of heading
   */
  depth: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Contents
   */
  line: Readonly<IPhrasingContentLine>
}

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
