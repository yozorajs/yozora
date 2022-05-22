import type { Code } from '@yozora/ast'
import { CodeType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'
import { findMaxContinuousSymbol } from '../util'

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
export class CodeWeaver implements INodeWeaver<Code> {
  public readonly type = CodeType
  public readonly isBlockLevel = (): boolean => true

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
      const symbolCnt = findMaxContinuousSymbol(value, tildeSymbolRegex)
      symbol = '~'.repeat(symbolCnt === 0 ? 3 : symbolCnt + 1)
    } else {
      const symbolCnt = findMaxContinuousSymbol(value, backtickSymbolRegex)
      symbol = '`'.repeat(symbolCnt === 0 ? 3 : symbolCnt + 1)
    }

    return { opener: `${symbol}${infoString}\n${value}${symbol}` }
  }
}
