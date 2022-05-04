import type { Image } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

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

  public weave(node: Image): INodeMarkup | string {
    return {
      opener: '![',
      closer: node.title ? `](${node.url} title="${node.title}")` : `](${node.url})`,
      content: node.alt ?? node.title ?? node.url,
    }
  }
}
