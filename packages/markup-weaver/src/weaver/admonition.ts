import { AdmonitionType } from '@yozora/ast'
import type { Admonition } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaveContext, INodeWeaver } from '../types'

/**
 * Admonitions are block elements. The titles can include inline markdown and
 * the body can include any block markdown except another admonition.
 *
 * @see https://github.com/elviswolcott/remark-admonitions
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#admonition
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/admonition
 */
export class AdmonitionWeaver implements INodeWeaver<Admonition> {
  public readonly type = AdmonitionType
  public readonly isBlockLevel = (): boolean => true

  public weave(node: Admonition, ctx: INodeMarkupWeaveContext): INodeMarkup {
    const title: string = ctx.weaveInlineNodes(node.title)
    return {
      opener: title ? `:::${node.keyword} ${title}\n` : `:::${node.keyword}\n`,
      closer: '\n:::',
    }
  }
}
