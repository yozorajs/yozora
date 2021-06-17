import { DefaultYastParser } from '@yozora/core-parser'
import AutolinkTokenizer from '@yozora/tokenizer-autolink'
import BlockquoteTokenizer from '@yozora/tokenizer-blockquote'
import BreakTokenizer from '@yozora/tokenizer-break'
import DefinitionTokenizer from '@yozora/tokenizer-definition'
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
import TextTokenizer from '@yozora/tokenizer-text'
import ThematicBreakTokenizer from '@yozora/tokenizer-thematic-break'
import type { GfmParserProps } from './types'

/**
 * Create a YastParser built-in tokenizers that fully supports GFM.
 *
 *  - @yozora/tokenizer-autolink
 *  - @yozora/tokenizer-blockquote
 *  - @yozora/tokenizer-break
 *  - @yozora/tokenizer-definition
 *  - @yozora/tokenizer-emphasis
 *  - @yozora/tokenizer-fenced-code
 *  - @yozora/tokenizer-heading
 *  - @yozora/tokenizer-html-block
 *  - @yozora/tokenizer-html-inline
 *  - @yozora/tokenizer-image
 *  - @yozora/tokenizer-image-reference
 *  - @yozora/tokenizer-indented-code
 *  - @yozora/tokenizer-inline-code
 *  - @yozora/tokenizer-link
 *  - @yozora/tokenizer-link-reference
 *  - @yozora/tokenizer-list
 *  - @yozora/tokenizer-list-item (disabled task list item)
 *  - @yozora/tokenizer-paragraph
 *  - @yozora/tokenizer-setext-heading
 *  - @yozora/tokenizer-text
 *  - @yozora/tokenizer-thematic-break
 *
 * @see https://github.github.com/gfm/
 */
export class GfmParser extends DefaultYastParser {
  constructor(props: GfmParserProps = {}) {
    super(props)

    // Set block fallback tokenizer.
    if (this.blockFallbackTokenizer == null) {
      this.useBlockFallbackTokenizer(new ParagraphTokenizer())
    }

    // Set inline fallback tokenizer.
    if (this.inlineFallbackTokenizer == null) {
      this.useInlineFallbackTokenizer(new TextTokenizer())
    }

    this

      // block tokenizers.
      .useTokenizer(new IndentedCodeTokenizer())
      .useTokenizer(new HtmlBlockTokenizer())
      .useTokenizer(new SetextHeadingTokenizer())
      .useTokenizer(new ThematicBreakTokenizer())
      .useTokenizer(new BlockquoteTokenizer())
      .useTokenizer(new ListItemTokenizer({ enableTaskListItem: false }))
      .useTokenizer(new HeadingTokenizer())
      .useTokenizer(new FencedCodeTokenizer())
      .useTokenizer(new DefinitionTokenizer())
      .useTokenizer(new ListTokenizer())

      // inline tokenizers.
      .useTokenizer(new HtmlInlineTokenizer())
      .useTokenizer(new InlineCodeTokenizer())
      .useTokenizer(new AutolinkTokenizer())
      .useTokenizer(new BreakTokenizer())
      .useTokenizer(new ImageTokenizer())
      .useTokenizer(new ImageReferenceTokenizer())
      .useTokenizer(new LinkTokenizer())
      .useTokenizer(new LinkReferenceTokenizer())
      .useTokenizer(new EmphasisTokenizer())
  }
}
