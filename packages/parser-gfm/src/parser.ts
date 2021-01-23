import { DefaultYastParser, YastParser } from '@yozora/parser-core'
import { BlockquoteTokenizer } from '@yozora/tokenizer-blockquote'
import { DeleteTokenizer } from '@yozora/tokenizer-delete'
import { EmphasisTokenizer } from '@yozora/tokenizer-emphasis'
import { FencedCodeTokenizer } from '@yozora/tokenizer-fenced-code'
import { HeadingTokenizer } from '@yozora/tokenizer-heading'
import { ImageTokenizer } from '@yozora/tokenizer-image'
import { IndentedCodeTokenizer } from '@yozora/tokenizer-indented-code'
import { InlineCodeTokenizer } from '@yozora/tokenizer-inline-code'
import { InlineFormulaTokenizer } from '@yozora/tokenizer-inline-formula'
import {
  InlineHtmlCommentTokenizer,
} from '@yozora/tokenizer-inline-html-comment'
import { LineBreakTokenizer } from '@yozora/tokenizer-line-break'
import { LinkTokenizer } from '@yozora/tokenizer-link'
import { LinkDefinitionTokenizer } from '@yozora/tokenizer-link-definition'
import { ListTokenizer } from '@yozora/tokenizer-list'
import { ListBulletItemTokenizer } from '@yozora/tokenizer-list-bullet-item'
import { ListOrderedItemTokenizer } from '@yozora/tokenizer-list-ordered-item'
import { ListTaskItemTokenizer } from '@yozora/tokenizer-list-task-item'
import { ParagraphTokenizer, ParagraphType } from '@yozora/tokenizer-paragraph'
import { ReferenceImageTokenizer } from '@yozora/tokenizer-reference-image'
import { ReferenceLinkTokenizer } from '@yozora/tokenizer-reference-link'
import { SetextHeadingTokenizer } from '@yozora/tokenizer-setext-heading'
import { TableTokenizer } from '@yozora/tokenizer-table'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { ThematicBreakTokenizer } from '@yozora/tokenizer-thematic-break'
import { DefaultBlockTokenizerContext } from '@yozora/tokenizercore-block'
import { PhrasingContentTokenizer } from '@yozora/tokenizercore-block'
import { DefaultInlineTokenizerContext } from '@yozora/tokenizercore-inline'


export class GFMDataNodeParser extends DefaultYastParser implements YastParser {
  public constructor() {
    // build block context
    const blockContext = new DefaultBlockTokenizerContext({
      fallbackTokenizer: new ParagraphTokenizer(),
    })
      // to handle PhrasingContentType
      .useTokenizer(new PhrasingContentTokenizer(), { 'match.list': false })

    blockContext
      .useTokenizer(new IndentedCodeTokenizer())
      .useTokenizer(new SetextHeadingTokenizer({
        interruptableTypes: [ParagraphType],
      }))
      .useTokenizer(new ThematicBreakTokenizer({
        interruptableTypes: [ParagraphType],
      }))
      .useTokenizer(new BlockquoteTokenizer({
        interruptableTypes: [ParagraphType],
      }))
      .useTokenizer(new ListBulletItemTokenizer({
        interruptableTypes: [ParagraphType],
        emptyItemCouldNotInterruptedTypes: [ParagraphType],
      }))
      .useTokenizer(new ListOrderedItemTokenizer({
        interruptableTypes: [ParagraphType],
        emptyItemCouldNotInterruptedTypes: [ParagraphType],
      }))
      .useTokenizer(new HeadingTokenizer({
        interruptableTypes: [ParagraphType],
      }))
      .useTokenizer(new FencedCodeTokenizer({
        interruptableTypes: [ParagraphType],
      }))
      .useTokenizer(new LinkDefinitionTokenizer())

      // transforming hooks
      .useTokenizer(new ListTaskItemTokenizer())
      .useTokenizer(new ListTokenizer())
      .useTokenizer(new TableTokenizer())


    // build inline context
    const inlineContext = new DefaultInlineTokenizerContext({
      fallbackTokenizer: new TextTokenizer({ priority: -1 }),
    })
      .useTokenizer(new InlineHtmlCommentTokenizer({ priority: 4 }))
      .useTokenizer(new InlineCodeTokenizer({ priority: 4 }))
      .useTokenizer(new InlineFormulaTokenizer({ priority: 4 }))
      .useTokenizer(new ImageTokenizer({ priority: 3.1 }))
      .useTokenizer(new ReferenceImageTokenizer({ priority: 3.1 }))
      .useTokenizer(new LinkTokenizer({ priority: 3 }))
      .useTokenizer(new ReferenceLinkTokenizer({ priority: 3 }))
      .useTokenizer(new LineBreakTokenizer({ priority: 2 }))
      .useTokenizer(new EmphasisTokenizer({ priority: 1 }))
      .useTokenizer(new DeleteTokenizer({ priority: 1 }))

    super(blockContext, inlineContext)
  }
}


export const gfmDataNodeParser = new GFMDataNodeParser()
