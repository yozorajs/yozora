import type { InlineCode } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

const symbolRegex = /([`]+)/g

/**
 * InlineCode represents a fragment of computer code, such as a file name,
 * computer program, or anything a computer could parse.
 *
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#inlinecode
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-code
 */
export class InlineCodeMarkupWeaver implements INodeMarkupWeaver<InlineCode> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(node: InlineCode): INodeMarkup {
    const { value } = node

    let backtickCnt = 0
    for (let match: RegExpExecArray | null = null; ; ) {
      match = symbolRegex.exec(value)
      if (match == null) break

      const len: number = match[1].length ?? 0
      if (backtickCnt < len) backtickCnt = len
    }

    if (backtickCnt === 0) {
      return {
        opener: '`',
        closer: '`',
        content: value,
      }
    }

    const symbol: string = '`'.repeat(backtickCnt + 1)
    return {
      opener: symbol + ' ',
      closer: ' ' + symbol,
      content: value,
    }
  }
}
