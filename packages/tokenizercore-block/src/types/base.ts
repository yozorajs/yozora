import type {
  YastNode,
  YastNodeData,
  YastNodeType,
} from '@yozora/tokenizercore'


/**
 * The variant of a YastBlockNode.
 */
export type YastBlockNodeType = YastNodeType


/**
 * Data of a YastBlockNode.
 */
export interface YastBlockNodeData extends YastNodeData {

}


/**
 * Block type YastNode.
 */
export interface YastBlockNode<
  T extends YastBlockNodeType = YastBlockNodeType,
  D extends YastBlockNodeData = YastBlockNodeData,
  > extends YastNode<T, D> {

}


/**
 * Meta data of YastBlockNode.
 */
export type YastBlockNodeMeta = Record<YastBlockNodeType, unknown>


/**
 * Matchable range of rows to be processed.
 */
export interface EatingLineInfo {
  /**
   * Line no of current line.
   */
  lineNo: number
  /**
   * The starting index of the rest of the current line.
   */
  startIndex: number
  /**
   * The ending index of the rest of the current line.
   */
  endIndex: number
  /**
   * The index of first non-blank character in the rest of the current line.
   */
  firstNonWhiteSpaceIndex: number
  /**
   * Whether the remaining content of the current line is blank.
   */
  isBlankLine: boolean
}
