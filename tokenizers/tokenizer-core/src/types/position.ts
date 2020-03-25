/**
 * 源文档中的位置坐标
 * one place in a source file.
 * @see https://github.com/syntax-tree/unist#point
 */
export interface DataNodePoint {
  /**
   * 行号
   * a line in a source file
   * @minimum 1
   */
  line: number
  /**
   * 列号
   * a column in a source file
   * @minimum 1
   */
  column: number
  /**
   * 偏移量（从 0 开始计数）
   * a character in a source file
   * @minimum 0
   */
  offset: number
}


/**
 * 数据节点在源文档中的位置
 * the location of a node in a source file.
 * @see https://github.com/syntax-tree/unist#position
 */
export interface DataNodePosition {
  /**
   * the place of the first character of the parsed source region
   */
  start: DataNodePoint
  /**
   * the place of the first character after the parsed source region
   */
  end: DataNodePoint
}
