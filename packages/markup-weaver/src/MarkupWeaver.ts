import type { Node, NodeType, Parent, Root } from '@yozora/ast'
import { RootType } from '@yozora/ast'
import type {
  IEscaper,
  IMarkupWeaver,
  INodeMarkup,
  INodeMarkupWeaveContext,
  INodeWeaver,
} from './types'
import { lineRegex } from './util'

interface IMarkupToken {
  node: Parent
  indent: string
  spread: boolean
}

export class MarkupWeaver implements IMarkupWeaver {
  protected readonly weaverMap: Map<string, INodeWeaver>

  constructor() {
    this.weaverMap = new Map()
  }

  public useWeaver(weaver: INodeWeaver, forceReplace = false): this {
    const types: string[] = Array.isArray(weaver.type)
      ? Array.from(new Set(weaver.type))
      : [weaver.type]
    for (const type of types) {
      if (forceReplace || !this.weaverMap.has(type)) {
        this.weaverMap.set(type, weaver)
      } else {
        console.error(`[useWeaver] Type(${type}) has been registered.`)
      }
    }
    return this
  }

  public unmountWeaver(type: string): this {
    this.weaverMap.delete(type)
    return this
  }

  public weave(ast: Readonly<Root>): string {
    const { weaverMap } = this
    const rootWeaver = weaverMap.get(RootType)
    const escapers: IEscaper[] = rootWeaver?.escapeContent ? [rootWeaver.escapeContent] : []
    const escaperIndexMap: Record<NodeType, number | undefined> = {}
    const escapeContent: IEscaper = content => {
      let result = content
      for (let i = escapers.length - 1; i >= 0; --i) {
        const escape: IEscaper = escapers[i]
        result = escape(result)
      }
      return result
    }

    const enqueue = (node: Readonly<Node>, weaver: INodeWeaver): void => {
      if (weaver.escapeContent && escaperIndexMap[node.type] === undefined) {
        escaperIndexMap[node.type] = escapers.length
        escapers.push(weaver.escapeContent)
      }
    }

    const dequeue = (node: Readonly<Node>): void => {
      if (escaperIndexMap[node.type] === escapers.length - 1) {
        escaperIndexMap[node.type] = undefined
        escapers.pop()
      }
    }

    const ancestors: Array<Readonly<Parent>> = [ast]
    const ctx: INodeMarkupWeaveContext = {
      ancestors,
      weaveInlineNodes,
    }
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

        enqueue(node, weaver)
        const isBlockLevel: boolean = weaver.isBlockLevel(node, ctx, childIndex)
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
            ancestors.push(token.node)

            let isPrevNodeBlockLevel = true
            for (let i = 0; i < children.length; ++i) {
              const nextChildWeaver = weaverMap.get(children[i].type)!
              const isNextNodeBlockLevel: boolean = nextChildWeaver?.isBlockLevel?.(
                children[i],
                ctx,
                i,
              )
              // eslint-disable-next-line no-plusplus
              if (isNextNodeBlockLevel && !isPrevNodeBlockLevel) lines[++lineIdx] = indent
              isPrevNodeBlockLevel = isNextNodeBlockLevel
              process(children[i], token, i)
            }

            ancestors.pop()
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
          const closerLines: string[] = markup.closer.split(lineRegex)
          if (closerLines.length > 0) {
            lines[lineIdx] += closerLines[0]
            for (let i = 1; i < closerLines.length; ++i) {
              // eslint-disable-next-line no-plusplus
              lines[++lineIdx] = indent + closerLines[i]
            }
          }
        }

        if (isBlockLevel && childIndex + 1 < parent.node.children.length) {
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

        dequeue(node)
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

        enqueue(node, weaver)
        const isBlockLevel: boolean = weaver.isBlockLevel(node, ctx, childIndex)
        if (isBlockLevel) {
          dequeue(node)
          throw new TypeError(`[MarkupWeaver.weave] Cannot processInline for block-level node.`)
        }

        let result = ''
        const markup: INodeMarkup = weaver.weave(node, ctx, childIndex)
        if (markup.opener) result += markup.opener
        if (markup.content === undefined) {
          const { children } = node as Parent
          ancestors.push(node as Parent)
          if (children && children.length >= 0) {
            for (let i = 0; i < children.length; ++i) {
              result += process(children[i], i)
            }
          }
          ancestors.pop()
        } else {
          result += escapeContent(markup.content)
        }

        if (markup.closer) {
          result += markup.closer
        }

        dequeue(node)
        return result
      }
    }
  }
}
