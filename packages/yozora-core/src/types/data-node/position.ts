/**
 * 资源文件中的位置坐标
 * Point represents one place in a source file.
 * @see https://github.com/syntax-tree/unist#point
 */
export interface DataNodeTokenPoint {
  /**
   * 偏移量（从 0 开始计数）
   * @minimum 0
   */
  offset: number
  /**
   * 行号
   * @minimum 1
   */
  line: number
  /**
   * 列号
   * @minimum 1
   */
  column: number
}


/**
 * 数据节点在资源文件中的位置信息
 * Position represents the location of a node in a source file.
 * @see https://github.com/syntax-tree/unist#position
 */
export interface DataNodeTokenPosition {
  /**
   * 起始位置（闭区间）
   * Starting position (closed)
   */
  start: DataNodeTokenPoint
  /**
   * 结束位置（开区间）
   * End position (open)
   */
  end: DataNodeTokenPoint
}
