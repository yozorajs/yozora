import type { IYastNode } from '@yozora/ast'
import type { INodeInterval, INodePoint } from '@yozora/character'
import type { IYastBlockToken } from './token'

/**
 * typeof IPhrasingContent
 */
export const PhrasingContentType = 'phrasingContent'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PhrasingContentType = typeof PhrasingContentType

/**
 * Phrasing content represent the text in a document, and its markup.
 *
 * @see https://github.com/syntax-tree/mdast#phrasingcontent
 */
export interface IPhrasingContent extends IYastNode<PhrasingContentType> {
  /**
   * Inline data nodes
   */
  contents: INodePoint[]
}

/**
 * Middle token during the whole match and parse phase.
 */
export interface IPhrasingContentToken
  extends IYastBlockToken<PhrasingContentType> {
  /**
   * Lines of a IPhrasingContent.
   */
  lines: IPhrasingContentLine[]
}

/**
 * Phrasing content lines
 */
export interface IPhrasingContentLine extends INodeInterval {
  /**
   * Array of INodePoint which contains all the contents of this line.
   */
  nodePoints: ReadonlyArray<INodePoint>
  /**
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhitespaceIndex: number
  /**
   * The precede space count, one tab equals four space.
   * @see https://github.github.com/gfm/#tabs
   */
  countOfPrecedeSpaces: number
}
