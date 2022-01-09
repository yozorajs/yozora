import type { INodeInterval, INodePoint } from '@yozora/character'

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
