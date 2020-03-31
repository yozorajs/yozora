import { DataNode, DataNodeTokenPointDetail, DataNodeTokenPosition } from '@yozora/tokenizer-core'
import { DataNodeParser, BaseDataNodeParser } from '@yozora/parser-core'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { DeleteTokenizer } from '@yozora/tokenizer-delete'
import { EmphasisTokenizer } from '@yozora/tokenizer-emphasis'
import { ImageTokenizer } from '@yozora/tokenizer-image'
import { InlineCodeTokenizer } from '@yozora/tokenizer-inline-code'
import { InlineFormulaTokenizer } from '@yozora/tokenizer-inline-formula'
import { InlineHtmlCommentTokenizer } from '@yozora/tokenizer-inline-html-comment'
import { LinkTokenizer } from '@yozora/tokenizer-link'
import { LineBreakTokenizer } from '@yozora/tokenizer-line-break'
import { ReferenceImageTokenizer } from '@yozora/tokenizer-reference-image'
import { ReferenceLinkTokenizer } from '@yozora/tokenizer-reference-link'


export class GFMDataNodeParser implements DataNodeParser {
  protected readonly dataNodeParser: DataNodeParser

  public constructor() {
    const gfmDataNodeParser = new BaseDataNodeParser(TextTokenizer)
    gfmDataNodeParser
      .useInlineDataTokenizer(1, DeleteTokenizer)
      .useInlineDataTokenizer(1, EmphasisTokenizer)
      .useInlineDataTokenizer(2, LineBreakTokenizer)
      .useInlineDataTokenizer(3, ReferenceLinkTokenizer)
      .useInlineDataTokenizer(3.1, ReferenceImageTokenizer)
      .useInlineDataTokenizer(3, LinkTokenizer)
      .useInlineDataTokenizer(3.1, ImageTokenizer)
      .useInlineDataTokenizer(4, InlineFormulaTokenizer)
      .useInlineDataTokenizer(4, InlineCodeTokenizer)
      .useInlineDataTokenizer(4, InlineHtmlCommentTokenizer)
    this.dataNodeParser = gfmDataNodeParser
  }

  /**
   * match content
   */
  public matchInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
  ): DataNodeTokenPosition[] {
    return this.dataNodeParser.matchInlineData(content, codePoints, startOffset, endOffset)
  }

  /**
   * parse matched results
   */
  public parseInlineData(
    content: string,
    codePoints?: DataNodeTokenPointDetail[],
    startOffset?: number,
    endOffset?: number,
    tokenPositions?: DataNodeTokenPosition[],
  ): DataNode[] {
    return this.dataNodeParser.parseInlineData(
      content, codePoints, startOffset, endOffset, tokenPositions)
  }
}


export const gfmDataNodeParser = new GFMDataNodeParser()
