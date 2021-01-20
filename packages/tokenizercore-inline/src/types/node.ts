import type {
  YastNode,
  YastNodeData,
  YastNodeType,
} from '@yozora/tokenizercore'


/**
 * The variant of a YastInlineNode.
 */
export type YastInlineNodeType = YastNodeType


/**
 * Data of YastInlineNode.
 */
export interface YastInlineNodeData extends YastNodeData { }


/**
 * Inline type of YastNode
 */
export interface YastInlineNode<
  T extends YastInlineNodeType = YastInlineNodeType,
  D extends YastInlineNodeData = YastInlineNodeData,
  > extends YastNode<T, D> {

}


/**
 * Content fragment
 */
export interface ContentFragment {
  /**
   * Start index of this content-fragment in nodePoints
   */
  startIndex: number
  /**
   * End index of this content-fragment in nodePoints
   */
  endIndex: number
}
