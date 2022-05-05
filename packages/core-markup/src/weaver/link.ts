import type { Link } from '@yozora/ast'
import type { IEscape, INodeMarkup, INodeMarkupWeaver } from '../types'

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
export class LinkMarkupWeaver implements INodeMarkupWeaver<Link> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false
  public readonly escape: IEscape = (content): string => content.replace(/([[\]])/g, '\\$1')

  public weave(node: Link): INodeMarkup | string {
    return {
      opener: '[',
      closer: node.title ? `](${node.url} title="${node.title}")` : `](${node.url})`,
    }
  }
}
