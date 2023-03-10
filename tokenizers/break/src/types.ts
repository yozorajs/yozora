import type { Break, BreakType } from '@yozora/ast'
import type {
  IBaseInlineTokenizerProps,
  IPartialInlineToken,
  ITokenDelimiter,
  ITokenizer,
} from '@yozora/core-tokenizer'

export type T = BreakType
export type INode = Break
export const uniqueName = '@yozora/tokenizer-break'

export type IToken = IPartialInlineToken<T>

export interface IDelimiter extends ITokenDelimiter {
  type: 'full'
  /**
   * Line break marker type.
   */
  markerType: BreakTokenMarkerType
}

export type IThis = ITokenizer

export type ITokenizerProps = Partial<IBaseInlineTokenizerProps>

/**
 * Line break marker type.
 */
export enum BreakTokenMarkerType {
  /**
   * Backslash at the end of the line
   */
  BACKSLASH = 'backslash',
  /**
   * More than two spaces at the end of the line
   */
  MORE_THAN_TWO_SPACES = 'more-than-two-spaces',
}
