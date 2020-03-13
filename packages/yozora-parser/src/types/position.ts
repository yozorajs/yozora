import { DataNodeType, DataNodeTokenPoint } from '@yozora/core'


/**
 * 资源内容的详细信息
 */
export interface DataNodeTokenPointDetail extends DataNodeTokenPoint {
  /**
   * unicode 的编码
   * unicode code point of content (`String.codePointAt()`)
   */
  codePoint: number
}



/**
 * 数据节点的边界的位置信息
 * Flanking position represents the location of a node in a source file.
 */
export interface DataNodeTokenFlanking {
  /**
   * 起始位置的偏移量（闭区间）
   * The offset of the start position (closed)
   */
  start: number
  /**
   * 结束位置的偏移量（开区间）
   * The offset of the end position  (open)
   */
  end: number
  /**
   * 边界的厚度（字符数）
   * Flanking thickness (number of characters)
   */
  thickness: number
}


/**
 * 数据节点在资源文件中的位置信息
 * DataNodeToken location information in the resource file
 */
export interface DataNodeTokenPosition<T extends DataNodeType = DataNodeType> {
  /**
   * 数据节点的类型
   */
  type: T
  /**
   * 左边界
   */
  left: DataNodeTokenFlanking
  /**
   * 右边界
   */
  right: DataNodeTokenFlanking
  /**
   * 数据节点内部的节点位置信息
   */
  children: DataNodeTokenPosition[]
}