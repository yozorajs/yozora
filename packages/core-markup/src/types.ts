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
}

export interface INodeMarkupWeaveContext {
  /**
   * Ancestor nodes.
   */
  ancestors: ReadonlyArray<Parent>
  // /**
  //  * Weave AST nodes into a content string or markup structure.
  //  * @param nodes
  //  */
  // weaveNodes(nodes: Node[]): INodeMarkup
}

export interface INodeMarkupWeaver<T extends Node = Node> {
  /**
   * Whether the content can be wrapped.
   */
  readonly couldBeWrapped: boolean
  /**
   * Whether the accepted node is block level.
   */
  readonly isBlockLevel: boolean
  /**
   * Escape contents.
   * @param content
   */
  readonly escapeContent?: IEscaper
  /**
   * Weave AST node into a content string or markup structure.
   *
   * @param node
   * @param ctx
   * @param childIndex
   */
  weave(node: T, ctx: INodeMarkupWeaveContext, childIndex: number): INodeMarkup | string
}

export interface IMarkupWeaver {
  /**
   *
   * @param type
   * @param weaver
   */
  useWeaver(type: NodeType, weaver: INodeMarkupWeaver): IMarkupWeaver
  /**
   *
   * @param ast
   */
  weave(ast: Root): string
}
