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
    .useTokenizer(new IndentedCodeTokenizer())
    .useTokenizer(new HtmlBlockTokenizer())
    .useTokenizer(new SetextHeadingTokenizer())
    .useTokenizer(new ThematicBreakTokenizer())
    .useTokenizer(new BlockquoteTokenizer())
    .useTokenizer(new ListItemTokenizer({ enableTaskListItem: true }))
    .useTokenizer(new HeadingTokenizer())
    .useTokenizer(new FencedCodeTokenizer())
    .useTokenizer(new DefinitionTokenizer())
    .useTokenizer(new TableTokenizer())
    .useTokenizer(new ListTokenizer())

    // inline tokenizers
    .useTokenizer(new HtmlInlineTokenizer())
    .useTokenizer(new InlineCodeTokenizer())
    .useTokenizer(new AutolinkTokenizer())
    .useTokenizer(new AutolinkExtensionTokenizer())
    .useTokenizer(new BreakTokenizer())
    .useTokenizer(new ImageTokenizer())
    .useTokenizer(new ImageReferenceTokenizer())
    .useTokenizer(new LinkTokenizer({ delimiterGroup: 'link' }))
    .useTokenizer(new LinkReferenceTokenizer({ delimiterGroup: 'link' }))
    .useTokenizer(new EmphasisTokenizer())
    .useTokenizer(new DeleteTokenizer())

  return parser
}
