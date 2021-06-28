import type { Break, BreakType } from '@yozora/ast'
import type {
  BaseInlineTokenizerProps,
  PartialYastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = BreakType
export type Node = Break
export const uniqueName = '@yozora/tokenizer-break'

export type Token = PartialYastInlineToken<T>

export interface Delimiter extends YastTokenDelimiter {
  type: 'full'
  /**
   * Line break marker type.
   */
  markerType: BreakTokenMarkerType
}

export type TokenizerProps = Partial<BaseInlineTokenizerProps>

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
