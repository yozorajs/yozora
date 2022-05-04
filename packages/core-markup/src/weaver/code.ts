import type { Code } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Code represents a block of preformatted text, such as ASCII art or computer code.
 *
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#code
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/fenced-code
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/indented-code
 */
export class CodeMarkupWeaver implements IMarkupWeaver<Code> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(node: Code): string | IMarkup {
    const { lang = '', meta = ' ' } = node
    return {
      opener: '```' + `${lang} ${meta}\n`,
      closer: '\n```',
      content: node.value,
    }
  }
}
