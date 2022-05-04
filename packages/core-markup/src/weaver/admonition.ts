import type { Admonition } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Admonitions are block elements. The titles can include inline markdown and
 * the body can include any block markdown except another admonition.
 *
 * @see https://github.com/elviswolcott/remark-admonitions
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#admonition
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/admonition
 */
export class AdmonitionMarkupWeaver implements INodeMarkupWeaver<Admonition> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(node: Admonition): string | INodeMarkup {
    return {
      opener: `:::${node.keyword}\n`,
      closer: '\n:::',
    }
  }
}
