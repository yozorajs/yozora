import type { IThematicBreak, ThematicBreakType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialYastBlockToken,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = ThematicBreakType
export type INode = IThematicBreak
export const uniqueName = '@yozora/tokenizer-thematic-break'

export interface IToken extends IPartialYastBlockToken<T> {
  /**
   * CodePoint of '-' / '_' / '*'
   */
  marker: number
  /**
   * Whether there are no internal spaces between marker characters
   */
  continuous: boolean
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseBlockTokenizerProps>
