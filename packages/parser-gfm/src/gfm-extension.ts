import type { YastParser } from '@yozora/core-parser'
import {
  DefaultYastParser,
  PhrasingContentTokenizer,
} from '@yozora/core-parser'
import { AutolinkTokenizer } from '@yozora/tokenizer-autolink'
import { AutolinkExtensionTokenizer } from '@yozora/tokenizer-autolink-extension'
import { BlockquoteTokenizer } from '@yozora/tokenizer-blockquote'
import { BreakTokenizer } from '@yozora/tokenizer-break'
import { DefinitionTokenizer } from '@yozora/tokenizer-definition'
import { DeleteTokenizer } from '@yozora/tokenizer-delete'
import { EmphasisTokenizer } from '@yozora/tokenizer-emphasis'
import { FencedCodeTokenizer } from '@yozora/tokenizer-fenced-code'
import { HeadingTokenizer } from '@yozora/tokenizer-heading'
import { HtmlBlockTokenizer } from '@yozora/tokenizer-html-block'
import { HtmlInlineTokenizer } from '@yozora/tokenizer-html-inline'
import { ImageTokenizer } from '@yozora/tokenizer-image'
import { ImageReferenceTokenizer } from '@yozora/tokenizer-image-reference'
import { IndentedCodeTokenizer } from '@yozora/tokenizer-indented-code'
import { InlineCodeTokenizer } from '@yozora/tokenizer-inline-code'
import { LinkTokenizer } from '@yozora/tokenizer-link'
import { LinkReferenceTokenizer } from '@yozora/tokenizer-link-reference'
import { ListTokenizer } from '@yozora/tokenizer-list'
import { ListItemTokenizer } from '@yozora/tokenizer-list-item'
import { ParagraphTokenizer, ParagraphType } from '@yozora/tokenizer-paragraph'
import { SetextHeadingTokenizer } from '@yozora/tokenizer-setext-heading'
import { TableTokenizer, TableType } from '@yozora/tokenizer-table'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { ThematicBreakTokenizer } from '@yozora/tokenizer-thematic-break'
import type { GFMParserProps } from './types'

/**
 * Create a YastParser in the Github Flavor Markdown and enable extensions.
 * @see https://github.github.com/gfm/
 */
export function createExGFMParser(props: GFMParserProps): YastParser {
  const shouldReservePosition =
    props.shouldReservePosition != null
      ? Boolean(props.shouldReservePosition)
      : false

  const parser = new DefaultYastParser({ shouldReservePosition })
    .useBlockFallbackTokenizer(new ParagraphTokenizer())
    .useInlineFallbackTokenizer(new TextTokenizer())
    .useTokenizer(new PhrasingContentTokenizer(), {
      'match-block': false,
      'post-match-block': false,
      'match-inline': false,
      'parse-inline': false,
    })

    // block tokenizers.
    .useTokenizer(new IndentedCodeTokenizer())
    .useTokenizer(
      new HtmlBlockTokenizer({
        interruptableTypes: [ParagraphType, TableType],
      }),
    )
    .useTokenizer(
      new SetextHeadingTokenizer({
        interruptableTypes: [ParagraphType, TableType],
      }),
    )
    .useTokenizer(
      new ThematicBreakTokenizer({
        interruptableTypes: [ParagraphType, TableType],
      }),
    )
    .useTokenizer(
      new BlockquoteTokenizer({
        interruptableTypes: [ParagraphType, TableType],
      }),
    )
    .useTokenizer(
      new ListItemTokenizer({
        enableTaskListItem: true,
        emptyItemCouldNotInterruptedTypes: [ParagraphType],
        interruptableTypes: [ParagraphType, TableType],
      }),
    )
    .useTokenizer(
      new HeadingTokenizer({ interruptableTypes: [ParagraphType, TableType] }),
    )
    .useTokenizer(
      new FencedCodeTokenizer({
        interruptableTypes: [ParagraphType, TableType],
      }),
    )
    .useTokenizer(new DefinitionTokenizer())
    .useTokenizer(new TableTokenizer({ interruptableTypes: [ParagraphType] }))
    .useTokenizer(new ListTokenizer())
    .useTokenizer(new HtmlInlineTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new InlineCodeTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new AutolinkTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new AutolinkExtensionTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new BreakTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new ImageTokenizer({ delimiterPriority: 2 }))
    .useTokenizer(new ImageReferenceTokenizer({ delimiterPriority: 2 }))
    .useTokenizer(
      new LinkTokenizer({ delimiterPriority: 2, delimiterGroup: 'link' }),
    )
    .useTokenizer(
      new LinkReferenceTokenizer({
        delimiterPriority: 2,
        delimiterGroup: 'link',
      }),
    )
    .useTokenizer(new EmphasisTokenizer({ delimiterPriority: 1 }))
    .useTokenizer(new DeleteTokenizer({ delimiterPriority: 1 }))

  return parser
}
