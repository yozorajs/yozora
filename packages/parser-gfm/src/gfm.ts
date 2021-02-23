import type { YastParser } from '@yozora/parser-core'
import type { GFMParserProps } from './types'
import {
  DefaultYastParser,
  PhrasingContentTokenizer,
} from '@yozora/parser-core'
import { AutolinkTokenizer } from '@yozora/tokenizer-autolink'
import { BlockquoteTokenizer } from '@yozora/tokenizer-blockquote'
import { BreakTokenizer } from '@yozora/tokenizer-break'
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
import { LinkDefinitionTokenizer } from '@yozora/tokenizer-link-definition'
import { LinkReferenceTokenizer } from '@yozora/tokenizer-link-reference'
import { ListTokenizer } from '@yozora/tokenizer-list'
import { ListItemTokenizer } from '@yozora/tokenizer-list-item'
import { ParagraphTokenizer, ParagraphType } from '@yozora/tokenizer-paragraph'
import { SetextHeadingTokenizer } from '@yozora/tokenizer-setext-heading'
import { TextTokenizer } from '@yozora/tokenizer-text'
import { ThematicBreakTokenizer } from '@yozora/tokenizer-thematic-break'


/**
 * Create a YastParser in the Github Flavor Markdown without extensions.
 * @see https://github.github.com/gfm/
 */
export function createGFMParser(props: GFMParserProps): YastParser {
  const shouldReservePosition = props.shouldReservePosition != null
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
    .useTokenizer(new HtmlBlockTokenizer({ interruptableTypes: [ParagraphType] }))
    .useTokenizer(new SetextHeadingTokenizer({ interruptableTypes: [ParagraphType] }))
    .useTokenizer(new ThematicBreakTokenizer({ interruptableTypes: [ParagraphType] }))
    .useTokenizer(new BlockquoteTokenizer({ interruptableTypes: [ParagraphType] }))
    .useTokenizer(new ListItemTokenizer({
      enableTaskListItem: false,
      emptyItemCouldNotInterruptedTypes: [ParagraphType],
      interruptableTypes: [ParagraphType],
    }))
    .useTokenizer(new HeadingTokenizer({ interruptableTypes: [ParagraphType] }))
    .useTokenizer(new FencedCodeTokenizer({ interruptableTypes: [ParagraphType] }))
    .useTokenizer(new LinkDefinitionTokenizer())
    .useTokenizer(new ListTokenizer())

    // inline tokenizers.
    .useTokenizer(new HtmlInlineTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new InlineCodeTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new AutolinkTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new BreakTokenizer({ delimiterPriority: 10 }))
    .useTokenizer(new ImageTokenizer({ delimiterPriority: 2 }))
    .useTokenizer(new ImageReferenceTokenizer({ delimiterPriority: 2 }))
    .useTokenizer(new LinkTokenizer({ delimiterPriority: 2, delimiterGroup: 'link' }))
    .useTokenizer(new LinkReferenceTokenizer({ delimiterPriority: 2, delimiterGroup: 'link' }))
    .useTokenizer(new EmphasisTokenizer({ delimiterPriority: 1 }))
  return parser
}
