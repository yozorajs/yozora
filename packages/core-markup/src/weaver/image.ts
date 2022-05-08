import type { Image } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Image represents an image.
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#image
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/image
 */
export class ImageMarkupWeaver implements INodeMarkupWeaver<Image> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false
  public readonly escapeContent: IEscaper = content => content.replace(/([[\]()])/g, '\\$1')

  public weave(node: Image): INodeMarkup | string {
    const url: string = this.escapeContent(node.url)
    const title: string | null = node.title ? this._escapeTitle(node.title) : null
    return {
      opener: '![',
      closer: title ? `](${url} "${title}")` : `](${url})`,
      content: node.alt ?? node.title ?? node.url,
    }
  }

  protected _escapeTitle(title: string): string {
    return title.replace(/(["])/g, '\\$1')
  }
}
