/**
 * Code point.
 */
export type CodePoint = number


/**
 * One place in the source file.
 * @see https://github.com/syntax-tree/unist#point
 */
export interface NodePoint {
  /**
   * Line in a source file.
   * @minimum 1
   */
  readonly line: number
  /**
   * Column column in a source file.
   * @minimum 1
   */
  readonly column: number
  /**
   * Character in a source file.
   * @minimum 0
   */
  readonly offset: number
  /**
   * Unicode code point of content (`String.codePointAt()`)
   */
  readonly codePoint: CodePoint
}
