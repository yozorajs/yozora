import { DataNodePoint } from './data-node'


/**
 * 资源内容的详细信息
 */
export interface DataNodeTokenPointDetail extends DataNodePoint {
  /**
   * unicode 的编码
   * unicode code point of content (`String.codePointAt()`)
   */
  codePoint: number
}
