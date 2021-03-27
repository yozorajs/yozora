import type { Break, BreakType } from '@yozora/ast'
import type {
  BaseTokenizerProps,
  YastInlineToken,
  YastTokenDelimiter,
} from '@yozora/core-tokenizer'

export type T = BreakType
export type Node = Break
export const uniqueName = '@yozora/tokenizer-break'

export type Token = YastInlineToken<T>

export interface Delimiter extends YastTokenDelimiter {
  /**
   * Line break marker type.
   */
  markerType: BreakTokenMarkerType
}

export interface TokenizerProps extends Omit<BaseTokenizerProps, 'name'> {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
}

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
