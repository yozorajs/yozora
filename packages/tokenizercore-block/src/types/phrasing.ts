import type { YastNodePoint } from '@yozora/tokenizercore'
import type { BlockTokenizerMatchPhaseState } from './lifecycle/match'
import type { BlockTokenizerParsePhaseState } from './lifecycle/parse'
import type { YastBlockNode } from './node'


/**
 * typeof PhrasingContent
 */
export const PhrasingContentDataNodeType = 'PHRASING_CONTENT'
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type PhrasingContentDataNodeType = typeof PhrasingContentDataNodeType


/**
 * Phrasing content lines
 */
export interface PhrasingContentLine {
  /**
   * code points of current line
   */
  nodePoints: YastNodePoint[]
  /**
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhiteSpaceIndex: number
}


/**
 * Phrasing content represent the text in a document, and its markup.
 *
 * @see https://github.com/syntax-tree/mdast#phrasingcontent
 */
export interface PhrasingContentDataNode extends
  YastBlockNode<PhrasingContentDataNodeType>,
  BlockTokenizerParsePhaseState<PhrasingContentDataNodeType> {
  /**
   * Inline data nodes
   */
  contents: YastNodePoint[]
}


/**
 * State of match phase of PhrasingContentTokenizer.
 */
export interface PhrasingContentMatchPhaseState
  extends BlockTokenizerMatchPhaseState<PhrasingContentDataNodeType> {
  /**
   * Lines of a PhrasingContent.
   */
  lines: PhrasingContentLine[]
}
