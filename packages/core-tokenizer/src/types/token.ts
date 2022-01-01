import type { IYastNodePosition, YastNodeType } from '@yozora/ast'
import type { INodeInterval } from '@yozora/character'

/**
 * Make a set of properties by key `K` become optional from `T`.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
declare type IPickPartial<T extends object, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>

/**
 * IToken delimiter.
 */
export interface IYastTokenDelimiter extends INodeInterval {
  /**
   * IDelimiter type.
   */
  type: 'opener' | 'closer' | 'both' | 'full'
}

/**
 * Potential IYastNode.
 */
export interface IYastToken<T extends YastNodeType = YastNodeType> {
  /**
   * Name of the tokenizer which produced this token.
   */
  _tokenizer: string
  /**
   * Type of the potential IYastNode.
   */
  nodeType: T
  /**
   * List of child node of current token node.
   */
  children?: ReadonlyArray<IYastToken>
}

/**
 * Block data type token.
 */
export interface IYastBlockToken<T extends YastNodeType = YastNodeType>
  extends IYastToken<T> {
  /**
   * Location of a node in the source contents.
   */
  position: IYastNodePosition
  /**
   * List of child node of current token node
   */
  children?: IYastBlockToken[]
}

/**
 * Inline data type token.
 */
export interface IYastInlineToken<T extends YastNodeType = YastNodeType>
  extends IYastToken<T>,
    INodeInterval {
  /**
   * List of child node of current token node.
   */
  children?: ReadonlyArray<IYastInlineToken>
}

/**
 * Make '_tokenizer' partial from IYastBlockToken.
 */
export type IPartialYastBlockToken<T extends YastNodeType = YastNodeType> =
  IPickPartial<IYastBlockToken<T>, '_tokenizer'>

/**
 * Make '_tokenizer' partial from IYastInlineToken.
 */
export type IPartialYastInlineToken<T extends YastNodeType = YastNodeType> =
  IPickPartial<IYastInlineToken<T>, '_tokenizer'>
