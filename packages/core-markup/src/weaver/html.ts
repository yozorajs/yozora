import type { Html } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

const symbolRegex = /([`]+)/g

/**
 * HTML (Literal) represents a fragment of raw HTML.
 *
 * @see https://github.com/syntax-tree/mdast#html
 * @see https://github.github.com/gfm/#html-blocks
 * @see https://github.github.com/gfm/#raw-html
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#html
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-code
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#html
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/html-block
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/html-inline
 */
export class HtmlMarkupWeaver implements INodeMarkupWeaver<Html> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = false

  public weave(node: Html): INodeMarkup {
    return {
      opener: node.value,
    }
  }
}
