import type { Frontmatter } from '@yozora/ast'
import { FrontmatterType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Frontmatter content represent out-of-band information about the document.
 *
 * @see https://github.com/syntax-tree/mdast#frontmattercontent
 * @see https://github.com/syntax-tree/mdast#yaml
 * @see https://github.github.com/gfm/#code-fence
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#frontmatter
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/frontmatter
 */
export class FrontmatterMarkupWeaver implements INodeMarkupWeaver<Frontmatter> {
  public readonly type = FrontmatterType
  public readonly isBlockLevel = (): boolean => true

  public weave(node: Frontmatter): INodeMarkup {
    return {
      opener: '---\n',
      closer: '\n---',
      content: node.value,
    }
  }
}
