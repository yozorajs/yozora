import type { NodeType, Position } from '@yozora/ast'
import type { INodeInterval } from '@yozora/character'

/**
 * Make a set of properties by key `K` become optional from `T`.
 */
declare type IPickPartial<T extends object, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * IToken delimiter.
 */
export interface ITokenDelimiter extends INodeInterval {
  /**
   * IDelimiter type.
   */
  type: 'opener' | 'closer' | 'both' | 'full'
}

/**
 * Potential Node.
 */
interface IToken<T extends NodeType = NodeType> {
  /**
   * Name of the tokenizer which produced this token.
   */
  _tokenizer: string
  /**
   * Type of the potential Node.
   */
  nodeType: T
  /**
   * List of child node of current token node.
   */
  children?: readonly IToken[]
}

/**
 * Block data type token.
 */
export interface IBlockToken<T extends NodeType = NodeType> extends IToken<T> {
  /**
   * Location of a node in the source contents.
   */
  position: Position
  /**
   * List of child node of current token node
   */
  children?: IBlockToken[]
}

/**
 * Inline data type token.
 */
export interface IInlineToken<T extends NodeType = NodeType> extends IToken<T>, INodeInterval {
  /**
   * List of child node of current token node.
   */
  children?: readonly IInlineToken[]
}

/**
 * Make '_tokenizer' partial from IBlockToken.
 */
export type IPartialBlockToken<T extends NodeType = NodeType> = IPickPartial<
  IBlockToken<T>,
  '_tokenizer'
>

/**
 * Make '_tokenizer' partial from IInlineToken.
 */
export type IPartialInlineToken<T extends NodeType = NodeType> = IPickPartial<
  IInlineToken<T>,
  '_tokenizer'
>
