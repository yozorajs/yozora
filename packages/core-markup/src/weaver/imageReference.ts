import type { ImageReference } from '@yozora/ast'
import { ImageReferenceType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeAlt: IEscaper = createCharacterEscaper('[]()'.split(''))

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
  public readonly type = ImageReferenceType
  public readonly isBlockLevel = (): boolean => false
  protected readonly escapeAlt = _escapeAlt

  public weave(node: ImageReference): INodeMarkup {
    const alt: string = this.escapeAlt(node.alt)
    return {
      opener: '![',
      closer: node.alt === node.label ? '][]' : `][${node.label}]`,
      content: alt,
    }
  }
}
