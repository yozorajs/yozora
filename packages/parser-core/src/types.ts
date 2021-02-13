import type { NodePoint } from '@yozora/character'
import type { YastRoot } from '@yozora/tokenizercore'
import type { BlockTokenizerContext } from '@yozora/tokenizercore-block'
import type { InlineTokenizerContext } from '@yozora/tokenizercore-inline'


/**
 * Parser for markdown like contents.
 */
export interface YastParser {
  /**
   * Block tokenizer context.
   */
  readonly blockContext: BlockTokenizerContext

  /**
   * Inline tokenizer context.
   */
  readonly inlineContext: InlineTokenizerContext

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
