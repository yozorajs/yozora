import type { Link } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Link represents a hyperlink.
 *
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#inline-link
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#link
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/autolink
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/autolink-extension
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/link
 */
export class LinkMarkupWeaver implements IMarkupWeaver<Link> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(node: Link): IMarkup | string {
    return {
      opener: '[',
      closer: node.title ? `](${node.url} title="${node.title}")` : `](${node.url})`,
    }
  }
}
