import type { Html, Node } from '@yozora/ast'
import { ParagraphType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaveContext, INodeMarkupWeaver } from '../types'

/**
 * HTML (Literal) represents a fragment of raw HTML.
 *
 * @see https://github.com/syntax-tree/mdast#html
 * @see https://github.github.com/gfm/#html-blocks
 * @see https://github.github.com/gfm/#raw-html
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#html
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-code
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#html
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/html-block
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/html-inline
 */
export class HtmlMarkupWeaver implements INodeMarkupWeaver<Html> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = (
    node: Html,
    ctx: INodeMarkupWeaveContext,
    childIndex: number,
  ): boolean => {
    if (ctx.ancestors.some(node => node.type === ParagraphType)) return false
    const siblings: Node[] = ctx.ancestors[ctx.ancestors.length - 1].children
    if (childIndex > 0) {
      const prevNode = siblings[childIndex - 1]
      if (prevNode.position?.end.line === node.position?.start.line) return false
    }
    if (childIndex + 1 < siblings.length) {
      const nextNode = siblings[childIndex + 1]
      if (node.position?.end.line === nextNode.position?.start.line) return false
    }
    return true
  }

  public weave(node: Html): INodeMarkup {
    return { opener: node.value }
  }
}
