import type { ImageReference } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * ImageReference represents an image through association, or its original
 * source if there is no association.
 *
 * @see https://github.github.com/gfm/#images
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#imagereference
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/image-reference
 */
export class ImageReferenceMarkupWeaver implements IMarkupWeaver<ImageReference> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = false

  public weave(node: ImageReference): IMarkup | string {
    if (node.alt === node.label) return `![${node.alt}][]`
    return `![${node.alt}][${node.label}]`
  }
}
