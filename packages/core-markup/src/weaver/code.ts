import type { Code } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Code represents a block of preformatted text, such as ASCII art or computer code.
 *
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#code
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/fenced-code
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/indented-code
 */
export class CodeMarkupWeaver implements INodeMarkupWeaver<Code> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(node: Code): string | INodeMarkup {
    let infoString = ''
    if (node.lang) {
      infoString += node.lang
      if (node.meta) infoString += ' ' + node.meta
    }

    return {
      opener: '```' + infoString + '\n',
      closer: '```',
      content: node.value,
    }
  }
}
