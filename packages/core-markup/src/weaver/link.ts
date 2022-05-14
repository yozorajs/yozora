import type { Link } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeContent: IEscaper = createCharacterEscaper('[]()'.split(''))
const _escapeTitle: IEscaper = createCharacterEscaper('"'.split(''))

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
  public readonly escapeContent: IEscaper = _escapeContent
  protected readonly escapeTitle = _escapeTitle

  public weave(node: Link): INodeMarkup {
    const url: string = /[()]/.test(node.url) ? `<${node.url}>` : node.url
    const title = node.title ? this.escapeTitle(node.title) : undefined
    return {
      opener: '[',
      closer: title ? `](${url} "${title}")` : `](${url})`,
    }
  }
}
