import type { ThematicBreak, ThematicBreakType } from '@yozora/ast'
import type {
  IBaseBlockTokenizerProps,
  IPartialBlockToken,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = ThematicBreakType
export type INode = ThematicBreak
export const uniqueName = '@yozora/tokenizer-thematic-break'

export interface IToken extends IPartialBlockToken<T> {
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
