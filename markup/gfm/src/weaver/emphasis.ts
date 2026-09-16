import type { Emphasis } from '@yozora/ast'
import { EmphasisType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaveContext, INodeWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeContent: IEscaper = createCharacterEscaper(['*', '_'])

/**
 * Emphasis represents stress emphasis of its contents.
 *
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#emphasis
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/emphasis
 */
export class EmphasisWeaver implements INodeWeaver<Emphasis> {
  public readonly type = EmphasisType
  public readonly isBlockLevel = (): boolean => false
  public readonly escapeContent: IEscaper = _escapeContent

  public weave(_node: Emphasis, ctx: INodeMarkupWeaveContext): INodeMarkup {
    let bit = 0
    for (let ancestors = ctx.ancestors, i = ancestors.length - 1; i >= 0; --i) {
      if (ancestors[i].type === EmphasisType) bit ^= 1
      else break
    }
    const symbol = bit ? '_' : '*'

    return {
      opener: symbol,
      closer: symbol,
    }
  }
}
