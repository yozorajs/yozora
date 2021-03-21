import type { YastNodeType } from '@yozora/ast'
import type { NodeInterval } from '@yozora/character'

/**
 * Token of match phase
 */
export interface YastToken<T extends YastNodeType = YastNodeType>
  extends NodeInterval {
  /**
   * Type of token.
   */
  type: T
  /**
   * List of child node of current token node.
   */
  children?: YastToken[]
}

/**
 * Token delimiter.
 */
export interface YastTokenDelimiter extends NodeInterval {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer' | 'both' | 'full'
}
