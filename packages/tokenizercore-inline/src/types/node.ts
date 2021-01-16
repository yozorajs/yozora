import type {
  EnhancedYastNodePoint,
  YastMeta,
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
 * Raw content need to handling
 */
export interface RawContent<M extends YastMeta = Record<string, any>> {
  /**
   * Meta data of content in the handling context
   */
  meta: M
  /**
   * Code positions of content
   */
  nodePoints: ReadonlyArray<EnhancedYastNodePoint>
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
