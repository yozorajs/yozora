import type { ImageReference } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * ImageReference represents an image through association, or its original
 * source if there is no association.
 *
 * @see https://github.github.com/gfm/#images
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#imagereference
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/image-reference
 */
export class ImageReferenceMarkupWeaver implements INodeMarkupWeaver<ImageReference> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = false
  public readonly escapeContent: IEscaper = content => content.replace(/([[\]()])/g, '\\$1')

  public weave(node: ImageReference): INodeMarkup | string {
    const alt: string = this.escapeContent(node.alt)
    if (node.alt === node.label) return `![${alt}][]`
    return `![${alt}][${node.label}]`
  }
}
