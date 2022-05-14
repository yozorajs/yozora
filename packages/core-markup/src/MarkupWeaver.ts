import type { List, Node, NodeType, Parent, Root } from '@yozora/ast'
import { ListItemType } from '@yozora/ast'
import type {
  IEscaper,
  IMarkupWeaver,
  INodeMarkup,
  INodeMarkupWeaveContext,
  INodeMarkupWeaver,
} from './types'

const lineRegex = /\r\n|\n|\r/g

export interface IMarkupToken {
  indent: string
  node: Parent
}

export class MarkupWeaver implements IMarkupWeaver {
  protected readonly weaverMap: Map<string, INodeMarkupWeaver>

  constructor() {
    this.weaverMap = new Map()
  }

  public useWeaver(type: NodeType, weaver: INodeMarkupWeaver): this {
    if (this.weaverMap.has(type)) {
      console.error(`[useWeaver] Type(${type}) has been registered.`)
      return this
    }
    this.weaverMap.set(type, weaver)
    return this
  }

  public weave(ast: Readonly<Root>): string {
    const { weaverMap } = this

    const escapers: IEscaper[] = []
    const escaperIndexMap: Record<NodeType, number | undefined> = {}
    const escapeContent: IEscaper = content => {
      let result = content
      for (let i = escapers.length - 1; i >= 0; --i) {
        const escape: IEscaper = escapers[i]
        result = escape(result)
      }
      return result
    }

    const ancestors: Parent[] = []
    const ctx: INodeMarkupWeaveContext = { ancestors }

    let lineIdx = 0
    const lines: string[] = ['']

    const process = (
      node: Readonly<Node>,
      parent: Readonly<IMarkupToken>,
      childIndex: number,
    ): void => {
      const weaver = weaverMap.get(node.type)
      if (weaver === undefined) {
        throw new TypeError(`[MarkupWeaver.weave] Cannot recognize node type(${node.type})`)
      }

      if (weaver.escapeContent && escaperIndexMap[node.type] === undefined) {
        escaperIndexMap[node.type] = escapers.length
        escapers.push(weaver.escapeContent)
      }
      ancestors.push(parent.node)

      const markup: INodeMarkup = weaver.weave(node, ctx, childIndex)
      const indent: string = parent.indent + (markup.indent ?? '')

      if (markup.opener) {
        const openerLines: string[] = markup.opener.split(lineRegex)
        if (openerLines.length > 0) {
          lines[lineIdx] += openerLines[0]
          for (let i = 1; i < openerLines.length; ++i) {
            // eslint-disable-next-line no-plusplus
            lines[++lineIdx] = indent + openerLines[i]
          }
        }
      }

      if (markup.content === undefined) {
        const { children } = node as Parent
        if (children && children.length >= 0) {
          const token: IMarkupToken = { indent, node: node as Parent }
          for (let i = 0; i < children.length; ++i) {
            process(children[i], token, i)
          }
        }
      } else {
        const content: string = escapeContent(markup.content)
        const subLines: string[] = content.split(lineRegex)
        if (subLines.length > 0) {
          lines[lineIdx] += subLines[0]
          for (let i = 1; i < subLines.length; ++i) {
            // eslint-disable-next-line no-plusplus
            lines[++lineIdx] = indent + subLines[i]
          }
        }
      }

      if (markup.closer) {
        // The terminal backslash of inline node could cause issues when its parent is inline node
        // and the parent has a closer symbol.
        if (!weaver.isBlockLevel) {
          lines[lineIdx] = lines[lineIdx].replace(/([\\]+)$/, (_m, p1) =>
            p1.length & 1 ? p1 + '\\' : p1,
          )
        }

        const closerLines: string[] = markup.closer.split(lineRegex)
        if (closerLines.length > 0) {
          lines[lineIdx] += closerLines[0]
          for (let i = 1; i < closerLines.length; ++i) {
            // eslint-disable-next-line no-plusplus
            lines[++lineIdx] = indent + closerLines[i]
          }
        }
      }

      if (weaver.isBlockLevel && childIndex + 1 < parent.node.children.length) {
        if (lines[lineIdx] === indent || lines[lineIdx] === parent.indent) {
          lines[lineIdx] = parent.indent
        } else {
          // eslint-disable-next-line no-plusplus
          lines[++lineIdx] = parent.indent
        }

        // Output a blank line for block level nodes.
        // Note: ListItem is an exception
        if (node.type !== ListItemType || (parent.node as List).spread) {
          // eslint-disable-next-line no-plusplus
          lines[++lineIdx] = parent.indent
        }
      }

      if (escaperIndexMap[node.type] === escapers.length - 1) {
        escaperIndexMap[node.type] = undefined
        escapers.pop()
      }
      ancestors.pop()
    }

    const rootToken: IMarkupToken = { indent: '', node: ast }
    for (let i = 0; i < ast.children.length; ++i) {
      process(ast.children[i], rootToken, i)
    }
    return lines.join('\n')
  }
}
