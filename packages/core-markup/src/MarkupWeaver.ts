import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type { IMarkupWeaver, INodeMarkup, INodeMarkupWeaver } from './types'

export interface IMarkupToken {
  opener: string
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
    let content = ''
    const { weaverMap } = this
    const process = (node: Node, parent: IMarkupToken, childIndex: number): void => {
      const weaver = weaverMap.get(node.type)
      if (weaver === undefined) {
        throw new TypeError(`[MarkupWeaver.weave] Cannot recognize node type(${node.type})`)
      }

      let markup: INodeMarkup | string = weaver.weave(node, parent.node, childIndex)
      if (typeof markup === 'string') markup = { content: markup }

      const opener: string = parent.opener + markup.opener ?? ''
      const indent: string = parent.indent + markup.indent ?? ''

      if (markup.content === undefined) {
        const { children } = node as Parent
        if (children && children.length >= 0) {
          const token: IMarkupToken = { opener, indent, node: node as Parent }
          for (let i = 0; i < children.length; ++i) {
            process(children[i], token, i)
          }
        }
      }

      if (markup.closer) content += markup.closer
      if (weaver.isBlockLevel) {
        if (!/\n$/.test(content)) content += '\n'
        if (childIndex < parent.node.children.length) {
          content += /^\s*$/.test(parent.indent) ? '\n' : parent.indent + '\n'
        }
      }
    }

    const rootToken: IMarkupToken = { opener: '', indent: '', node: ast }
    for (let i = 0; i < ast.children.length; ++i) {
      process(ast.children[i], rootToken, i)
    }
    return content
  }
}
