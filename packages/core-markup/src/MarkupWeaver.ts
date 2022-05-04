import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { IMarkupWeaver, INodeMarkup, INodeMarkupWeaver } from './types'

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

  public weave(ast: Root): string {
    const lines: string[] = ['']
    const { weaverMap } = this
    const process = (node: Node, parent: IMarkupToken, childIndex: number): void => {
      const weaver = weaverMap.get(node.type)
      if (weaver === undefined) {
        throw new TypeError(`[MarkupWeaver.weave] Cannot recognize node type(${node.type})`)
      }

      let markup: INodeMarkup | string = weaver.weave(node, parent.node, childIndex)
      if (typeof markup === 'string') markup = { content: markup }

      const indent: string = parent.indent + markup.indent ?? ''
      let idx: number = lines.length - 1

      if (markup.opener) {
        const openerLines: string[] = markup.opener.split(lineRegex)
        if (openerLines.length > 0) {
          lines[idx] += openerLines[0]
          for (let i = 1; i < openerLines.length; ++i) {
            // eslint-disable-next-line no-plusplus
            lines[++idx] = indent + openerLines[i]
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
        const subLines: string[] = markup.content.split(lineRegex)
        if (subLines.length > 0) {
          lines[idx] += subLines[0]
          for (let i = 1; i < subLines.length; ++i) {
            // eslint-disable-next-line no-plusplus
            lines[++idx] = indent + subLines[i]
          }
        }
      }

      if (markup.closer) {
        const closerLines: string[] = markup.closer.split(lineRegex)
        if (closerLines.length > 0) {
          lines[idx] += closerLines[0]
          for (let i = 1; i < closerLines.length; ++i) {
            // eslint-disable-next-line no-plusplus
            lines[++idx] = indent + closerLines[i]
          }
        }
      }

      if (weaver.isBlockLevel) {
        if (lines[idx] === indent || lines[idx] === parent.indent) {
          lines[idx] = parent.indent
          // eslint-disable-next-line no-plusplus
          lines[++idx] = parent.indent
        }
      }
    }

    const rootToken: IMarkupToken = { indent: '', node: ast }
    for (let i = 0; i < ast.children.length; ++i) {
      process(ast.children[i], rootToken, i)
    }
    return lines.join('\n')
  }
}
