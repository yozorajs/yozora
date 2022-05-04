import type { InlineCode } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

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
export class InlineCodeMarkupWeaver implements IMarkupWeaver<InlineCode> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(node: InlineCode): IMarkup | string {
    const { value } = node

    let symbolCnt = 1
    for (let match: RegExpExecArray | null = null; ; ) {
      match = symbolRegex.exec(value)
      if (match == null) break

      const len: number = match[1].length ?? 0
      if (symbolCnt <= len) symbolCnt = len + 1
    }

    if (symbolCnt === 1) return '`' + value + '`'

    const symbol: string = '`'.repeat(symbolCnt)
    return {
      opener: symbol + ' ',
      closer: ' ' + symbol,
      content: value,
    }
  }
}
