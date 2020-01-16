import { InlineDataNodeType } from './inline/_base'
import { BlockDataNodeType } from './block/_base'


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


/**
 * 匹配指定数据节点类型的边界位置信息
 * Boundary position information matching the specified DataNode type
 */
export interface DataNodeTokenFlankingGraph<T extends InlineDataNodeType | BlockDataNodeType> {
  /**
   * 边界所包围的内容的数据节点类型
   * DataNode type of what the boundary contains
   */
  type: T
  /**
   * 边界线位置信息集合；每一个元素都是左边界最左侧或右边界最右侧的点
   * positions information of the leftmost point of the left
   * boundary and rightmost point of right boundary
   */
  points: DataNodeTokenPoint[]
  /**
   * <LEFT_MOST_POINT, RIGHT_MOST_POINT[]> 的二元组列表
   *
   * 第一维表示左边界的节点下标，按照 <LEFT_MOST_POINT>.offset 升序排序
   * 第二维表示可以与其所属的左边界匹配的有边界的节点下表列表，按照 <RIGHT_MOST_POINT>.offset 升序排序
   *
   * The first dimension represents the node index of the left boundary,
   * sorted in ascending order by <LEFT_MOST_POINT>.offset;
   * The second dimension represents a list of bordered nodes that can match
   * the left boundary to which they belong, sorted in ascending order by <RIGHT_MOST_POINT>.offset
   */
  edges: [number, number[]][]
}
