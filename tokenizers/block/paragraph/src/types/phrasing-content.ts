import {
  DataNodeTokenPointDetail,
  InlineDataNode,
} from '@yozora/tokenizercore'
import {
  BlockDataNode,
  BlockTokenizerMatchPhaseState,
  BlockTokenizerParsePhaseState,
} from '@yozora/tokenizercore-block'


/**
 * typeof PhrasingContentDataNode
 */
export const PhrasingContentDataNodeType = 'PHRASING_CONTENT'
export type PhrasingContentDataNodeType = typeof PhrasingContentDataNodeType


/**
 * Phrasing content represent the text in a document, and its markup.
 *
 * @see https://github.com/syntax-tree/mdast#phrasingcontent
 */
export interface PhrasingContentDataNode extends
  BlockDataNode<PhrasingContentDataNodeType>,
  BlockTokenizerParsePhaseState<PhrasingContentDataNodeType> {
  /**
   * Inline data nodes
   */
  contents: InlineDataNode[]
}


/**
 * line of PhrasingContent
 */
export interface PhrasingContentLine {
  /**
   * code points of current line
   */
  codePositions: DataNodeTokenPointDetail[]
  /**
   * 当前行剩余内容第一个非空白字符的下标
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhiteSpaceIndex: number
}


/**
 * State of match phase of PhrasingContentTokenizer
 */
export interface PhrasingContentMatchPhaseState
  extends BlockTokenizerMatchPhaseState<PhrasingContentDataNodeType> {
  /**
   * PhrasingContent 中的文本内容
   */
  lines: PhrasingContentLine[]
}
