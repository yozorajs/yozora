import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import type {
  IEscaper,
  IMarkupWeaver,
  INodeMarkup,
  INodeMarkupWeaveContext,
  INodeMarkupWeaver,
} from './types'

const lineRegex = /\r\n|\n|\r/g
const escapeEndBackslash: IEscaper = content =>
  content.replace(/([\\]+)$/, (_m, p1) => (p1.length & 1 ? p1 + '\\' : p1))

interface IMarkupToken {
  node: Parent
  indent: string
  spread: boolean
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

    const ancestors: Array<Readonly<Parent>> = []
    const ctx: INodeMarkupWeaveContext = { ancestors, weaveInlineNodes: weaveInlineNodes }
    return weaveNodes()

    function weaveNodes(): string {
      let lineIdx = 0
      const lines: string[] = ['']

      const rootToken: IMarkupToken = {
        node: ast,
        indent: '',
        spread: true,
      }
      for (let i = 0; i < ast.children.length; ++i) process(ast.children[i], rootToken, i)
      return lines.join('\n')
      function process(
        node: Readonly<Node>,
        parent: Readonly<IMarkupToken>,
        childIndex: number,
      ): void {
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
            const token: IMarkupToken = {
              indent,
              node: node as Parent,
              spread: markup.spread ?? parent.spread,
            }
            let prevChildWeaver: INodeMarkupWeaver | undefined
            for (let i = 0; i < children.length; ++i) {
              const nextChildWeaver = weaverMap.get(children[i].type)!
              if (i > 0 && nextChildWeaver?.isBlockLevel && !prevChildWeaver!.isBlockLevel) {
                // eslint-disable-next-line no-plusplus
                lines[++lineIdx] = indent
              }
              prevChildWeaver = nextChildWeaver
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
          if (!weaver.isBlockLevel) lines[lineIdx] = escapeEndBackslash(lines[lineIdx])

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
          if (parent.spread) {
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
    }

    function weaveInlineNodes(nodes: ReadonlyArray<Readonly<Node>>): string {
      let result = ''
      for (let i = 0; i < nodes.length; ++i) {
        result += process(nodes[i], i)
      }
      return result

      function process(node: Readonly<Node>, childIndex: number): string {
        const weaver = weaverMap.get(node.type)
        if (weaver === undefined) {
          throw new TypeError(`[MarkupWeaver.weave] Cannot recognize node type(${node.type})`)
        }

        if (weaver.isBlockLevel) {
          throw new TypeError(`[MarkupWeaver.weave] Cannot processInline for block-level node.`)
        }

        if (weaver.escapeContent && escaperIndexMap[node.type] === undefined) {
          escaperIndexMap[node.type] = escapers.length
          escapers.push(weaver.escapeContent)
        }
        ancestors.push(node as Parent)

        let result = ''
        const markup: INodeMarkup = weaver.weave(node, ctx, childIndex)
        if (markup.opener) result += markup.opener
        if (markup.content === undefined) {
          const { children } = node as Parent
          if (children && children.length >= 0) {
            for (let i = 0; i < children.length; ++i) {
              result += process(children[i], i)
            }
          }
        } else {
          result += escapeContent(markup.content)
        }

        if (markup.closer) {
          // The terminal backslash of inline node could cause issues when its parent is inline node
          // and the parent has a closer symbol.
          if (!weaver.isBlockLevel) result = escapeEndBackslash(result)
          result += markup.closer
        }

        if (escaperIndexMap[node.type] === escapers.length - 1) {
          escaperIndexMap[node.type] = undefined
          escapers.pop()
        }
        ancestors.pop()
        return result
      }
    }
  }
}
