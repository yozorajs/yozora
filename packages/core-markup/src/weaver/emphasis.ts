import type { Emphasis } from '@yozora/ast'
import { EmphasisType } from '@yozora/ast'
import type { IEscaper, INodeMarkup, INodeMarkupWeaveContext, INodeMarkupWeaver } from '../types'
import { createCharacterEscaper } from '../util'

const _escapeContent: IEscaper = createCharacterEscaper(['*', '_'])

/**
 * Emphasis represents stress emphasis of its contents.
 *
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#emphasis
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/emphasis
 */
export class EmphasisMarkupWeaver implements INodeMarkupWeaver<Emphasis> {
  public readonly couldBeWrapped = true
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
