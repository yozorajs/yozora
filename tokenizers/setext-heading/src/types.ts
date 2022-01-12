import type { Heading, HeadingType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = HeadingType
export type INode = Heading
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

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
