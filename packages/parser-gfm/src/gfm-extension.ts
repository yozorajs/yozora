import type { YastParser } from '@yozora/core-parser'
import { DefaultYastParser } from '@yozora/core-parser'
import AutolinkTokenizer from '@yozora/tokenizer-autolink'
import AutolinkExtensionTokenizer from '@yozora/tokenizer-autolink-extension'
import BlockquoteTokenizer from '@yozora/tokenizer-blockquote'
import BreakTokenizer from '@yozora/tokenizer-break'
import DefinitionTokenizer from '@yozora/tokenizer-definition'
import DeleteTokenizer from '@yozora/tokenizer-delete'
import EmphasisTokenizer from '@yozora/tokenizer-emphasis'
import FencedCodeTokenizer from '@yozora/tokenizer-fenced-code'
import HeadingTokenizer from '@yozora/tokenizer-heading'
import HtmlBlockTokenizer from '@yozora/tokenizer-html-block'
import HtmlInlineTokenizer from '@yozora/tokenizer-html-inline'
import ImageTokenizer from '@yozora/tokenizer-image'
import ImageReferenceTokenizer from '@yozora/tokenizer-image-reference'
import IndentedCodeTokenizer from '@yozora/tokenizer-indented-code'
import InlineCodeTokenizer from '@yozora/tokenizer-inline-code'
import LinkTokenizer from '@yozora/tokenizer-link'
import LinkReferenceTokenizer from '@yozora/tokenizer-link-reference'
import ListTokenizer from '@yozora/tokenizer-list'
import ListItemTokenizer from '@yozora/tokenizer-list-item'
import ParagraphTokenizer from '@yozora/tokenizer-paragraph'
import SetextHeadingTokenizer from '@yozora/tokenizer-setext-heading'
import TableTokenizer from '@yozora/tokenizer-table'
import TextTokenizer from '@yozora/tokenizer-text'
import ThematicBreakTokenizer from '@yozora/tokenizer-thematic-break'
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

    // block tokenizers.
    .useTokenizer(new IndentedCodeTokenizer({ priority: 10 }))
    .useTokenizer(new HtmlBlockTokenizer({ priority: 10 }))
    .useTokenizer(new SetextHeadingTokenizer({ priority: 10 }))
    .useTokenizer(new ThematicBreakTokenizer({ priority: 10 }))
    .useTokenizer(new BlockquoteTokenizer({ priority: 10 }))
    .useTokenizer(
      new ListItemTokenizer({ priority: 10, enableTaskListItem: true }),
    )
    .useTokenizer(new HeadingTokenizer({ priority: 10 }))
    .useTokenizer(new FencedCodeTokenizer({ priority: 10 }))
    .useTokenizer(new DefinitionTokenizer({ priority: 10 }))
    .useTokenizer(new ListTokenizer({ priority: 10 }))
    .useTokenizer(new TableTokenizer({ priority: 1 }))
    .useTokenizer(new HtmlInlineTokenizer({ priority: 10 }))
    .useTokenizer(new InlineCodeTokenizer({ priority: 10 }))
    .useTokenizer(new AutolinkTokenizer({ priority: 10 }))
    .useTokenizer(new AutolinkExtensionTokenizer({ priority: 10 }))
    .useTokenizer(new BreakTokenizer({ priority: 10 }))
    .useTokenizer(new ImageTokenizer({ priority: 2 }))
    .useTokenizer(new ImageReferenceTokenizer({ priority: 2 }))
    .useTokenizer(new LinkTokenizer({ priority: 2, delimiterGroup: 'link' }))
    .useTokenizer(
      new LinkReferenceTokenizer({ priority: 2, delimiterGroup: 'link' }),
    )
    .useTokenizer(new EmphasisTokenizer({ priority: 1 }))
    .useTokenizer(new DeleteTokenizer({ priority: 1 }))

  return parser
}
