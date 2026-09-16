import type { Break, Text } from '@yozora/ast'
import { BreakType, TextType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaveContext, INodeWeaver } from '../types'

/**
 * Break represents a line break, such as in poems or addresses.
 *
 * @see https://github.com/syntax-tree/mdast#break
 * @see https://github.github.com/gfm/#hard-line-breaks
 * @see https://github.github.com/gfm/#soft-line-breaks
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#break
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/break
 */
export class BreakWeaver implements INodeWeaver<Break> {
  public readonly type = BreakType
  public readonly isBlockLevel = (): boolean => false

  public weave(node: Break, ctx: INodeMarkupWeaveContext, childIndex: number): INodeMarkup {
    const parent = ctx.ancestors[ctx.ancestors.length - 1]
    const nextNode = parent?.children[childIndex] === node ? parent.children[childIndex + 1] : null
    const nextText = nextNode?.type === TextType ? (nextNode as Text) : null
    const firstCharacter = nextText?.value[0]

    // Older parsers stored the line ending in the Text following a Break.
    const hasLegacyLineEnding = firstCharacter === '\n' || firstCharacter === '\r'
    return {
      opener: hasLegacyLineEnding ? '\\' : '\\\n',
    }
  }
}
