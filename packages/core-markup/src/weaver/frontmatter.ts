import type { Frontmatter } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Frontmatter content represent out-of-band information about the document.
 *
 * @see https://github.com/syntax-tree/mdast#frontmattercontent
 * @see https://github.com/syntax-tree/mdast#yaml
 * @see https://github.github.com/gfm/#code-fence
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#frontmatter
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/frontmatter
 */
export class FrontmatterMarkupWeaver implements IMarkupWeaver<Frontmatter> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(node: Frontmatter): IMarkup | string {
    return {
      opener: '---\n',
      closer: '\n---',
      content: node.value,
    }
  }
}
