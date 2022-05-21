import type { Node, NodeType, Parent, Root } from '@yozora/ast'

export type IEscaper = (text: string) => string

export interface INodeMarkup {
  /**
   * Opener markers.
   * @param node
   */
  opener?: string
  /**
   * Closer markers.
   * @param node
   */
  closer?: string
  /**
   * Prefix markers in subsequence lines.
   * @param node
   */
  indent?: string
  /**
   * Source contents between `opener` and `closer`.
   */
  content?: string
  /**
   * Output a blank line for block level nodes.
   * @default true
   */
  spread?: boolean
}

export interface INodeMarkupWeaveContext {
  /**
   * Ancestor nodes.
   */
  ancestors: ReadonlyArray<Parent>
  /**
   * Weave AST inline nodes into markup source content.
   * @param nodes
   */
  weaveInlineNodes(nodes: ReadonlyArray<Readonly<Node>>): string
}

export interface INodeMarkupWeaver<T extends Node = Node> {
  /**
   * Node type
   */
  readonly type: T['type'] | Array<T['type']>
  /**
   * Whether the content can be wrapped.
   */
  readonly couldBeWrapped: boolean
  /**
   * Escape contents.
   * @param content
   */
  readonly escapeContent?: IEscaper
  /**
   * Whether the accepted node is block level.
   * @param node
   * @param ctx
   * @param childIndex
   */
  isBlockLevel(node: T, ctx: INodeMarkupWeaveContext, childIndex: number): boolean
  /**
   * Weave AST node into a content string or markup structure.
   * @param node
   * @param ctx
   * @param childIndex
   */
  weave(node: T, ctx: INodeMarkupWeaveContext, childIndex: number): INodeMarkup
}

export interface IMarkupWeaver {
  /**
   *
   * @param weaver
   */
  useWeaver(weaver: INodeMarkupWeaver): IMarkupWeaver
  /**
   *
   * @param ast
   */
  weave(ast: Root): string
}
