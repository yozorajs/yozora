import type { Heading } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Heading represents a heading of a section.
 *
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#heading
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/heading
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/setext-heading
 */
export class HeadingMarkupWeaver implements INodeMarkupWeaver<Heading> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = (): boolean => true

  public weave(node: Heading): INodeMarkup {
    return {
      opener: '#'.repeat(node.depth) + ' ',
    }
  }
}
