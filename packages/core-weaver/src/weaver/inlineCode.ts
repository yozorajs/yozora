import type { InlineCode } from '@yozora/ast'
import { InlineCodeType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'
import { findMaxContinuousSymbol } from '../util'

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
export class InlineCodeWeaver implements INodeWeaver<InlineCode> {
  public readonly type = InlineCodeType
  public readonly isBlockLevel = (): boolean => false

  public weave(node: InlineCode): INodeMarkup {
    const value: string = node.value
    const backtickCnt = findMaxContinuousSymbol(value, symbolRegex)
    if (backtickCnt === 0) return { opener: '`' + value + '`' }

    const backticks: string = '`'.repeat(backtickCnt + 1)
    return { opener: `${backticks} ${value} ${backticks}` }
  }
}
