import type { Break } from '@yozora/ast'
import type { YastToken, YastTokenDelimiter } from '@yozora/core-tokenizer'

export const uniqueName = '@yozora/tokenizer-break'
export type T = typeof uniqueName
export type Node = Break

/**
 * A break token.
 */
export type Token = YastToken<T>

/**
 * Delimiter of BreakToken.
 */
export interface Delimiter extends YastTokenDelimiter {
  /**
   * Line break marker type.
   */
  markerType: BreakTokenMarkerType
}

/**
 * Params for constructing BreakTokenizer
 */
export interface TokenizerProps {
  /**
   * Delimiter group identity.
   */
  readonly delimiterGroup?: string
  /**
   * Delimiter priority.
   */
  readonly delimiterPriority?: number
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
