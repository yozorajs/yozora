import type { Heading } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Heading represents a heading of a section.
 *
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#heading
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/heading
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/setext-heading
 */
export class HeadingMarkupWeaver implements IMarkupWeaver<Heading> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(node: Heading): string | IMarkup {
    return {
      opener: '#'.repeat(node.depth) + ' ',
    }
  }
}
