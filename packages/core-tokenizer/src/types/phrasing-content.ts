import type { INodeInterval, INodePoint } from '@yozora/character'

/**
 * Phrasing content lines
 */
export interface IPhrasingContentLine extends INodeInterval {
  /**
   * Array of INodePoint which contains all the contents of this line.
   */
  nodePoints: readonly INodePoint[]
  /**
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhitespaceIndex: number
  /**
   * Visual width of the preceding indentation.
   */
  indentWidth: number
}
