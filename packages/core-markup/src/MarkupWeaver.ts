import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { IEscape, IMarkupWeaver, INodeMarkup, INodeMarkupWeaver } from './types'

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
    let lineIdx = 0
    const lines: string[] = ['']

    const escapes: IEscape[] = []
    const escapeCountMap: Record<NodeType, number> = {}
    const escape: IEscape = content => {
      let result = content
      for (let i = escapes.length - 1; i >= 0; --i) {
        result = escapes[i](result)
      }
      return result
    }

    const { weaverMap } = this

    const process = (
      node: Readonly<Node>,
      parent: Readonly<IMarkupToken>,
      childIndex: number,
    ): void => {
      const weaver = weaverMap.get(node.type)
      if (weaver === undefined) {
        throw new TypeError(`[MarkupWeaver.weave] Cannot recognize node type(${node.type})`)
      }

      if (escapeCountMap[node.type] === undefined) {
        escapeCountMap[node.type] = 1
        if (weaver.escape) escapes.push(weaver.escape)
      } else {
        escapeCountMap[node.type] += 1
      }

      let markup: INodeMarkup | string = weaver.weave(node, parent.node, childIndex)
      if (typeof markup === 'string') markup = { content: markup }

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
        const content: string = escape(markup.content)
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
          // eslint-disable-next-line no-plusplus
          lines[++lineIdx] = parent.indent
        } else {
          // eslint-disable-next-line no-plusplus
          lines[++lineIdx] = parent.indent
          // eslint-disable-next-line no-plusplus
          lines[++lineIdx] = parent.indent
        }
      }

      // eslint-disable-next-line no-plusplus
      if (--escapeCountMap[node.type] <= 0) escapes.pop()
    }

    const rootToken: IMarkupToken = { indent: '', node: ast }
    for (let i = 0; i < ast.children.length; ++i) {
      process(ast.children[i], rootToken, i)
    }
    return lines.join('\n')
  }
}
