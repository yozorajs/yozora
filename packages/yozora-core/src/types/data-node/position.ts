import { DataNode } from './_base'
/**
 * 资源内容中的位置坐标
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
 * 分词器的解析结果
 * @see https://github.com/syntax-tree/unist#position
 */
export interface DataNodeToken<T extends DataNode = DataNode> {
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
  /**
   * 指定左右边界间解析出的数据节点内容
   */
  data: T[]
}
