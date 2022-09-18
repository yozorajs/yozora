import type { Image } from '@yozora/ast'
import { ImageType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeContent: IEscaper = createCharacterEscaper('[]()`'.split(''))
const _escapeTitle: IEscaper = createCharacterEscaper('"`'.split(''))

/**
 * Image represents an image.
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#image
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/image
 */
export class ImageWeaver implements INodeWeaver<Image> {
  public readonly type = ImageType
  public readonly isBlockLevel = (): boolean => false
  public readonly escapeContent: IEscaper = _escapeContent
  protected readonly escapeTitle = _escapeTitle

  public weave(node: Image): INodeMarkup {
    const url: string = /[()]/.test(node.url) ? `<${node.url}>` : node.url
    const title = node.title ? this.escapeTitle(node.title) : undefined
    return {
      opener: '![',
      closer: title ? `](${url} "${title}")` : `](${url})`,
      content: node.alt ?? node.title ?? node.url,
    }
  }
}
