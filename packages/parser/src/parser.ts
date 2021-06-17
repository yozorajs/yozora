import { DefaultYastParser } from '@yozora/core-parser'
import AdmonitionTokenizer from '@yozora/tokenizer-admonition'
import AutolinkTokenizer from '@yozora/tokenizer-autolink'
import AutolinkExtensionTokenizer from '@yozora/tokenizer-autolink-extension'
import BlockquoteTokenizer from '@yozora/tokenizer-blockquote'
import BreakTokenizer from '@yozora/tokenizer-break'
import DefinitionTokenizer from '@yozora/tokenizer-definition'
import DeleteTokenizer from '@yozora/tokenizer-delete'
import EmphasisTokenizer from '@yozora/tokenizer-emphasis'
import FencedCodeTokenizer from '@yozora/tokenizer-fenced-code'
import FootnoteTokenizer from '@yozora/tokenizer-footnote'
import FootnoteDefinitionTokenizer from '@yozora/tokenizer-footnote-definition'
import FootnoteReferenceTokenizer from '@yozora/tokenizer-footnote-reference'
import HeadingTokenizer from '@yozora/tokenizer-heading'
import HtmlBlockTokenizer from '@yozora/tokenizer-html-block'
import HtmlInlineTokenizer from '@yozora/tokenizer-html-inline'
import ImageTokenizer from '@yozora/tokenizer-image'
import ImageReferenceTokenizer from '@yozora/tokenizer-image-reference'
import IndentedCodeTokenizer from '@yozora/tokenizer-indented-code'
import InlineCodeTokenizer from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import LinkTokenizer from '@yozora/tokenizer-link'
import LinkReferenceTokenizer from '@yozora/tokenizer-link-reference'
import ListTokenizer from '@yozora/tokenizer-list'
import ListItemTokenizer from '@yozora/tokenizer-list-item'
import MathTokenizer from '@yozora/tokenizer-math'
import ParagraphTokenizer from '@yozora/tokenizer-paragraph'
import SetextHeadingTokenizer from '@yozora/tokenizer-setext-heading'
import TableTokenizer from '@yozora/tokenizer-table'
import TextTokenizer from '@yozora/tokenizer-text'
import ThematicBreakTokenizer from '@yozora/tokenizer-thematic-break'
import type { YozoraParserProps } from './types'

/**
 * Create a YastParser with a rich tokenizers built-in:
 *
 *  * All tokenizers for processing tokens defined Github Flavor Markdown:
 *
 *    - @yozora/tokenizer-autolink
 *    - @yozora/tokenizer-autolink-extension (GFM extension)
 *    - @yozora/tokenizer-blockquote
 *    - @yozora/tokenizer-break
 *    - @yozora/tokenizer-definition
 *    - @yozora/tokenizer-delete (GFM extension)
 *    - @yozora/tokenizer-emphasis
 *    - @yozora/tokenizer-fenced-code
 *    - @yozora/tokenizer-heading
 *    - @yozora/tokenizer-html-block
 *    - @yozora/tokenizer-html-inline
 *    - @yozora/tokenizer-image
 *    - @yozora/tokenizer-image-reference
 *    - @yozora/tokenizer-indented-code
 *    - @yozora/tokenizer-inline-code
 *    - @yozora/tokenizer-link
 *    - @yozora/tokenizer-link-reference
 *    - @yozora/tokenizer-list
 *    - @yozora/tokenizer-list-item (GFM extension, enabled task list item)
 *    - @yozora/tokenizer-paragraph
 *    - @yozora/tokenizer-setext-heading
 *    - @yozora/tokenizer-table (GFM extension)
 *    - @yozora/tokenizer-text
 *    - @yozora/tokenizer-thematic-break
 *
 *  * Additional tokenizers
 *
 *    - @yozora/tokenizer-admonition
 *    - @yozora/tokenizer-footnote
 *    - @yozora/tokenizer-footnote-definition
 *    - @yozora/tokenizer-footnote-reference
 *    - @yozora/tokenizer-inline-math
 *    - @yozora/tokenizer-math
 *
 * @see https://github.github.com/gfm/
 */
export class YozoraParser extends DefaultYastParser {
  constructor(props: YozoraParserProps = {}) {
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
      .useTokenizer(new ListItemTokenizer({ enableTaskListItem: true }))
      .useTokenizer(new HeadingTokenizer())
      .useTokenizer(new FencedCodeTokenizer())
      .useTokenizer(new AdmonitionTokenizer())
      .useTokenizer(new MathTokenizer())
      .useTokenizer(new DefinitionTokenizer())
      .useTokenizer(new FootnoteDefinitionTokenizer())
      .useTokenizer(new TableTokenizer())
      .useTokenizer(new ListTokenizer())

      // inline tokenizers.
      .useTokenizer(new HtmlInlineTokenizer())
      .useTokenizer(new InlineMathTokenizer({ backtickRequired: false }))
      .useTokenizer(new InlineCodeTokenizer())
      .useTokenizer(new AutolinkTokenizer())
      .useTokenizer(new AutolinkExtensionTokenizer())
      .useTokenizer(new BreakTokenizer())
      .useTokenizer(new FootnoteTokenizer())
      .useTokenizer(new FootnoteReferenceTokenizer())
      .useTokenizer(new ImageTokenizer())
      .useTokenizer(new ImageReferenceTokenizer())
      .useTokenizer(new LinkTokenizer())
      .useTokenizer(new LinkReferenceTokenizer())
      .useTokenizer(new EmphasisTokenizer())
      .useTokenizer(new DeleteTokenizer())
  }
}
