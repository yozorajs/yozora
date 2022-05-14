import type { Code } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

const backtickSymbolRegex = /(?:\n|^)([`]+)/g
const tildeSymbolRegex = /(?:\n|^)([~]+)/g

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

  public weave(node: Code): INodeMarkup {
    const { value } = node

    let infoString = ''
    if (node.lang) {
      infoString += node.lang
      if (node.meta) infoString += ' ' + node.meta
    }

    let symbol = '```'

    /**
     * - Info strings for backtick code blocks cannot contain backticks.
     * - Info strings for tilde code blocks can contain backticks and tildes:
     *
     * @see https://github.github.com/gfm/#example-115
     * @see https://github.github.com/gfm/#example-116
     */
    if (/[`]/.test(infoString)) {
      const symbolCnt = this._findSymbolCnt(value, tildeSymbolRegex)
      symbol = '~'.repeat(symbolCnt)
    } else {
      const symbolCnt = this._findSymbolCnt(value, backtickSymbolRegex)
      symbol = '`'.repeat(symbolCnt)
    }

    return { opener: `${symbol}${infoString}\n${value}${symbol}` }
  }

  protected _findSymbolCnt(value: string, symbolRegex: RegExp): number {
    let symbolCnt = 0
    for (let match: RegExpExecArray | null = null; ; ) {
      match = symbolRegex.exec(value)
      if (match == null) break

      const len: number = match[1].length ?? 0
      if (symbolCnt < len) symbolCnt = len
    }
    return symbolCnt === 0 ? 3 : symbolCnt + 1
  }
}
