import type { YastParser } from '@yozora/parser-core'
import { DefaultYastParser } from '@yozora/parser-core'
import { AutolinkTokenizer } from '@yozora/tokenizer-autolink'
import {
  AutolinkExtensionTokenizer,
} from '@yozora/tokenizer-autolink-extension'
import { BlockquoteTokenizer } from '@yozora/tokenizer-blockquote'
import { DeleteTokenizer } from '@yozora/tokenizer-delete'
import { EmphasisTokenizer } from '@yozora/tokenizer-emphasis'
import { FencedCodeTokenizer } from '@yozora/tokenizer-fenced-code'
import { HeadingTokenizer } from '@yozora/tokenizer-heading'
import { HtmlBlockTokenizer } from '@yozora/tokenizer-html-block'
import { HtmlInlineTokenizer } from '@yozora/tokenizer-html-inline'
import { ImageTokenizer } from '@yozora/tokenizer-image'
import { IndentedCodeTokenizer } from '@yozora/tokenizer-indented-code'
import { InlineCodeTokenizer } from '@yozora/tokenizer-inline-code'
import { InlineFormulaTokenizer } from '@yozora/tokenizer-inline-formula'
import { LineBreakTokenizer } from '@yozora/tokenizer-line-break'
import { LinkTokenizer } from '@yozora/tokenizer-link'
import { LinkDefinitionTokenizer } from '@yozora/tokenizer-link-definition'
import { ListTokenizer } from '@yozora/tokenizer-list'
import { ListItemTokenizer } from '@yozora/tokenizer-list-item'
import { ParagraphTokenizer, ParagraphType } from '@yozora/tokenizer-paragraph'
import { ReferenceImageTokenizer } from '@yozora/tokenizer-reference-image'
import { ReferenceLinkTokenizer } from '@yozora/tokenizer-reference-link'
import { SetextHeadingTokenizer } from '@yozora/tokenizer-setext-heading'
import { TableTokenizer, TableType } from '@yozora/tokenizer-table'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { ThematicBreakTokenizer } from '@yozora/tokenizer-thematic-break'
import { DefaultBlockTokenizerContext } from '@yozora/tokenizercore-block'
import { PhrasingContentTokenizer } from '@yozora/tokenizercore-block'
import { DefaultInlineTokenizerContext } from '@yozora/tokenizercore-inline'


/**
 * Create a YastParser in the Github Flavor Markdown and enable extensions.
 * @see https://github.github.com/gfm/
 */
export function createExGFMParser(): YastParser {
  const blockContext = new DefaultBlockTokenizerContext()
    // fallback tokenizer.
    .useFallbackTokenizer(new ParagraphTokenizer())

    // to handle PhrasingContentType
    .useTokenizer(new PhrasingContentTokenizer(), {
      'match': false,
      'post-match': false,
    })
    .useTokenizer(new IndentedCodeTokenizer())
    .useTokenizer(new HtmlBlockTokenizer({
      interruptableTypes: [ParagraphType, TableType],
    }))
    .useTokenizer(new SetextHeadingTokenizer({
      interruptableTypes: [ParagraphType, TableType],
    }))
    .useTokenizer(new ThematicBreakTokenizer({
      interruptableTypes: [ParagraphType, TableType],
    }))
    .useTokenizer(new BlockquoteTokenizer({
      interruptableTypes: [ParagraphType, TableType],
    }))
    .useTokenizer(new ListItemTokenizer({
      enableTaskListItem: true,
      interruptableTypes: [ParagraphType, TableType],
      emptyItemCouldNotInterruptedTypes: [ParagraphType],
    }))
    .useTokenizer(new HeadingTokenizer({
      interruptableTypes: [ParagraphType, TableType],
    }))
    .useTokenizer(new FencedCodeTokenizer({
      interruptableTypes: [ParagraphType, TableType],
    }))
    .useTokenizer(new LinkDefinitionTokenizer())
    .useTokenizer(new TableTokenizer({
      interruptableTypes: [ParagraphType],
    }))

    // transforming hooks
    .useTokenizer(new ListTokenizer())

  // build inline context
  const inlineContext = new DefaultInlineTokenizerContext()
    .useFallbackTokenizer(new TextTokenizer())
    .useTokenizer(new HtmlInlineTokenizer())
    .useTokenizer(new InlineCodeTokenizer())
    .useTokenizer(new InlineFormulaTokenizer())
    .useTokenizer(new AutolinkTokenizer())
    .useTokenizer(new AutolinkExtensionTokenizer())
    .useTokenizer(new LineBreakTokenizer())
    .useTokenizer(new ImageTokenizer({ delimiterPriority: 2 }))
    .useTokenizer(new ReferenceImageTokenizer({ delimiterPriority: 2 }))
    .useTokenizer(new LinkTokenizer({ delimiterPriority: 2, delimiterGroup: 'link' }))
    .useTokenizer(new ReferenceLinkTokenizer({ delimiterPriority: 2, delimiterGroup: 'link' }))
    .useTokenizer(new EmphasisTokenizer({ delimiterPriority: 1 }))
    .useTokenizer(new DeleteTokenizer({ delimiterPriority: 1 }))

  const parser = new DefaultYastParser(blockContext, inlineContext)
  return parser
}
