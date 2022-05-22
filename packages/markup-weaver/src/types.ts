import type { Node, NodeType, Parent, Root } from '@yozora/ast'

export interface IMarkupWeaver {
  /**
   * Register ast node weaver into weave context.
   * @param weaver
   * @param forceReplace
   */
  useWeaver(weaver: INodeWeaver, forceReplace?: boolean): this
  /**
   * Remove ast node weaver by the node type.
   * @param type
   */
  unmountWeaver(type: NodeType): this
  /**
   * Resolve the ast node into markup content.
   * @param ast
   */
  weave(ast: Root): string
}

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

export interface INodeWeaver<T extends Node = Node> {
  /**
   * Node type
   */
  readonly type: T['type'] | Array<T['type']>
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
