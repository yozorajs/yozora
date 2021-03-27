import type { PickPartial } from '@guanghechen/utility-types'
import type { YastNodePosition, YastNodeType } from '@yozora/ast'
import type { NodeInterval } from '@yozora/character'

/**
 * Token delimiter.
 */
export interface YastTokenDelimiter extends NodeInterval {
  /**
   * Delimiter type.
   */
  type: 'opener' | 'closer' | 'both' | 'full'
}

/**
 * Potential YastNode.
 */
export interface YastToken<T extends YastNodeType = YastNodeType> {
  /**
   * Name of the tokenizer which produced this token.
   */
  _tokenizer: string
  /**
   * Type of the potential YastNode.
   */
  nodeType: T
  /**
   * List of child node of current token node.
   */
  children?: YastToken[]
}

/**
 * Block data type token.
 */
export interface YastBlockToken<T extends YastNodeType = YastNodeType>
  extends YastToken<T> {
  /**
   * Location of a node in the source contents.
   */
  position: YastNodePosition
  /**
   * List of child node of current token node
   */
  children?: YastBlockToken[]
}

/**
 * Inline data type token.
 */
export interface YastInlineToken<T extends YastNodeType = YastNodeType>
  extends YastToken<T>,
    NodeInterval {
  /**
   * List of child node of current token node.
   */
  children?: YastInlineToken[]
}

/**
 * Make '_tokenizer' partial from YastBlockToken.
 */
export type PartialYastBlockToken<
  T extends YastNodeType = YastNodeType
> = PickPartial<YastBlockToken<T>, '_tokenizer'>

/**
 * Make '_tokenizer' partial from YastInlineToken.
 */
export type PartialYastInlineToken<
  T extends YastNodeType = YastNodeType
> = PickPartial<YastInlineToken<T>, '_tokenizer'>
