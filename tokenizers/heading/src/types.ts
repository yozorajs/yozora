import type { Heading, HeadingType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialBlockToken,
  IPhrasingContentLine,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = HeadingType
export type INode = Heading
export const uniqueName = '@yozora/tokenizer-heading'

export interface IToken extends IPartialBlockToken<T> {
  /**
   * Level of heading
   */
  depth: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Contents
   */
  line: Readonly<IPhrasingContentLine>
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
