import type { NodePoint } from '@yozora/character'
import type { YastRoot } from '@yozora/tokenizercore'


/**
 * Parser for markdown like contents.
 */
export interface YastParser {
  /**
   * Parse matched results
   *
   * @param content         source content
   * @param startIndex      start index of content
   * @param endIndex        end index of contents
   * @param nodePoints   point detail of content
   */
  parse(
    content: string,
    startIndex?: number,
    endIndex?: number,
    nodePoints?: ReadonlyArray<NodePoint>,
  ): YastRoot
}
