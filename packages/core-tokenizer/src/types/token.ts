import type { NodeInterval } from '@yozora/character'
import type { YastNodeType } from './node'

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
